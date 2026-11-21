/** Service photos kept on the site itself (public/images/services), so pages do not depend on another website. */
const LOCAL = new Set(["photo-1416879595882-3373a0480b5b", "photo-1452587925148-ce544e77e70d", "photo-1454165804606-c3d57bc86b40", "photo-1455390582262-044cdead277a", "photo-1460925895917-afdab827c52f", "photo-1467232004584-a241de8bcf5d", "photo-1475721027785-f74eccf877e2", "photo-1478737270239-2f02b77fc618", "photo-1492684223066-81342ee5ff30", "photo-1497366216548-37526070297c", "photo-1519167758481-83f550bb49b3", "photo-1519225421980-715cb0215aed", "photo-1521791055366-0d553872125f", "photo-1540575467063-178a50c2df87", "photo-1542744094-3a31f272c490", "photo-1544620347-c4fd4a3d5957", "photo-1554224155-6726b3ff858f", "photo-1554224155-8d04cb21cd6c", "photo-1555244162-803834f70033", "photo-1556742049-0cfed4f6a45d", "photo-1556910103-1c02745aae4d", "photo-1557804506-669a67965ba0", "photo-1559526324-4b87b5e36e44", "photo-1562259929-b4e1fd3aef09", "photo-1571019614242-c5c5dee9f50b", "photo-1579621970563-ebec7560ff3e", "photo-1581578731548-c64695cc6952", "photo-1585704032915-c3400ca199e7", "photo-1589829545856-d10d557cf95f", "photo-1593078166039-c9878df5c520", "photo-1596526131083-e8c633c948d2", "photo-1600518464441-9154a4dea21b", "photo-1601758228041-f3b2795255f1", "photo-1621905251189-08b45d6a269e", "photo-1626785774573-4b799315345d"]);

/** The address to load for a service photo: the local copy when there is one, otherwise the address as stored. */
export function servicePhoto(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const id = /photo-[0-9a-f-]+/.exec(url)?.[0];
  return id && LOCAL.has(id) ? `/images/services/${id}.webp` : url;
}
