export class ZipWriter {
  constructor() {
    this.files = [];
  }

  async addFile(name, blob) {
    const arrayBuffer = await blob.arrayBuffer();
    this.files.push({ name, arrayBuffer });
  }

  generate() {
    const encoder = new TextEncoder();
    let offset = 0;
    const fileRecords = [];
    const centralRecords = [];

    for (const file of this.files) {
      const nameBytes = encoder.encode(file.name);
      const header = new Uint8Array(30 + nameBytes.length);
      const dv = new DataView(header.buffer);

      dv.setUint32(0, 0x04034b50, true);
      dv.setUint16(26, nameBytes.length, true);

      header.set(nameBytes, 30);

      fileRecords.push(header, new Uint8Array(file.arrayBuffer));

      const central = new Uint8Array(46 + nameBytes.length);
      const dv2 = new DataView(central.buffer);

      dv2.setUint32(0, 0x02014b50, true);
      dv2.setUint16(28, nameBytes.length, true);
      dv2.setUint32(42, offset, true);

      central.set(nameBytes, 46);

      centralRecords.push(central);

      offset += header.length + file.arrayBuffer.byteLength;
    }

    const centralSize = centralRecords.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array(22);
    const dv3 = new DataView(end.buffer);

    dv3.setUint32(0, 0x06054b50, true);
    dv3.setUint16(8, this.files.length, true);
    dv3.setUint16(10, this.files.length, true);
    dv3.setUint32(12, centralSize, true);
    dv3.setUint32(16, offset, true);

    return new Blob([...fileRecords, ...centralRecords, end], { type: "application/zip" });
  }
}
