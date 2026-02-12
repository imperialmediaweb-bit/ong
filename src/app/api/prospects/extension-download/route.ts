import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

function addFileToZip(
  files: { path: string; data: Buffer }[],
  basePath: string,
  relativeTo: string
) {
  const entries = readdirSync(basePath);
  for (const entry of entries) {
    const fullPath = join(basePath, entry);
    const stat = statSync(fullPath);
    const relPath = fullPath.replace(relativeTo + "/", "");
    if (stat.isDirectory()) {
      addFileToZip(files, fullPath, relativeTo);
    } else {
      files.push({ path: relPath, data: readFileSync(fullPath) });
    }
  }
}

// Minimal ZIP file creator (no external dependencies)
function createZipBuffer(files: { path: string; data: Buffer }[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuffer = Buffer.from(file.path, "utf-8");
    const data = file.data;

    // CRC-32
    const crc = crc32(data);

    // Local file header (30 bytes + name + data)
    const local = Buffer.alloc(30 + nameBuffer.length + data.length);
    local.writeUInt32LE(0x04034b50, 0); // Local file header signature
    local.writeUInt16LE(20, 4); // Version needed
    local.writeUInt16LE(0, 6); // Flags
    local.writeUInt16LE(0, 8); // Compression: stored
    local.writeUInt16LE(0, 10); // Mod time
    local.writeUInt16LE(0, 12); // Mod date
    local.writeUInt32LE(crc, 14); // CRC-32
    local.writeUInt32LE(data.length, 18); // Compressed size
    local.writeUInt32LE(data.length, 22); // Uncompressed size
    local.writeUInt16LE(nameBuffer.length, 26); // File name length
    local.writeUInt16LE(0, 28); // Extra field length
    nameBuffer.copy(local, 30);
    data.copy(local, 30 + nameBuffer.length);

    // Central directory header (46 bytes + name)
    const central = Buffer.alloc(46 + nameBuffer.length);
    central.writeUInt32LE(0x02014b50, 0); // Central directory signature
    central.writeUInt16LE(20, 4); // Version made by
    central.writeUInt16LE(20, 6); // Version needed
    central.writeUInt16LE(0, 8); // Flags
    central.writeUInt16LE(0, 10); // Compression: stored
    central.writeUInt16LE(0, 12); // Mod time
    central.writeUInt16LE(0, 14); // Mod date
    central.writeUInt32LE(crc, 16); // CRC-32
    central.writeUInt32LE(data.length, 20); // Compressed size
    central.writeUInt32LE(data.length, 24); // Uncompressed size
    central.writeUInt16LE(nameBuffer.length, 28); // File name length
    central.writeUInt16LE(0, 30); // Extra field length
    central.writeUInt16LE(0, 32); // File comment length
    central.writeUInt16LE(0, 34); // Disk number
    central.writeUInt16LE(0, 36); // Internal attributes
    central.writeUInt32LE(0, 38); // External attributes
    central.writeUInt32LE(offset, 42); // Relative offset
    nameBuffer.copy(central, 46);

    localHeaders.push(local);
    centralHeaders.push(central);
    offset += local.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);

  // End of central directory record (22 bytes)
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  endRecord.writeUInt16LE(0, 4); // Disk number
  endRecord.writeUInt16LE(0, 6); // Central dir disk
  endRecord.writeUInt16LE(files.length, 8); // Entries on this disk
  endRecord.writeUInt16LE(files.length, 10); // Total entries
  endRecord.writeUInt32LE(centralDirSize, 12); // Central dir size
  endRecord.writeUInt32LE(centralDirOffset, 16); // Central dir offset
  endRecord.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, endRecord]);
}

// CRC-32 implementation
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

// GET /api/prospects/extension-download — Download chrome extension as .zip
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const extensionDir = join(process.cwd(), "chrome-extension");

    const files: { path: string; data: Buffer }[] = [];
    addFileToZip(files, extensionDir, extensionDir);

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Extension files not found" },
        { status: 404 }
      );
    }

    // Keep files at ZIP root so Chrome Web Store can find manifest.json
    const zipBuffer = createZipBuffer(files);

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition":
          'attachment; filename="binevo-chrome-extension.zip"',
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error("Extension download error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
