import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_cZ8mlG7bOKAF@ep-mute-mountain-axr6l0hd-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require");

async function seed() {
  console.log('Inserting nextjscmstheme...');
  await sql`
    INSERT INTO marketplace_themes (name, slug, description, image_url, download_url, author, version, category)
    VALUES (
      'NextjsCMS Theme',
      'nextjscmstheme',
      'A brand new external test theme for the Marketplace.',
      NULL,
      'https://npm.pkg.github.com/@nextjscms/theme-nextjscmstheme/-/theme-nextjscmstheme-1.0.0.tgz',
      'External Developer',
      '1.0.0',
      'Testing'
    ) ON CONFLICT (slug) DO UPDATE 
      SET description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          version = EXCLUDED.version,
          download_url = EXCLUDED.download_url;
  `;

  console.log('Successfully inserted test theme!');
}

seed().catch(console.error);
