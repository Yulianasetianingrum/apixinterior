
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const longUrl = "https://www.google.com/maps/embed?pb=" + "a".repeat(250);
    console.log("Original Length:", longUrl.length); // Should be roughly 287

    console.log("Attempting to create generic branch...");
    const created = await prisma.cabangToko.create({
        data: {
            namaCabang: "Test Truncation Check",
            mapsUrl: longUrl,
        }
    });

    console.log("Created ID:", created.id);
    console.log("Stored MapsUrl:", created.mapsUrl);
    console.log("Stored MapsUrl Length:", created.mapsUrl.length);

    if (created.mapsUrl.length === longUrl.length) {
        console.log("SUCCESS: Database supports long text.");
    } else {
        console.log("FAILURE: Database truncated the text.");
    }

    // Cleanup
    await prisma.cabangToko.delete({ where: { id: created.id } });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
