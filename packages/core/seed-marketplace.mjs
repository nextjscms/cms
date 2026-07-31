import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_cZ8mlG7bOKAF@ep-mute-mountain-axr6l0hd-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require");

async function seed() {
  console.log('Creating table...');
  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_themes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      download_url TEXT NOT NULL,
      author VARCHAR(255),
      version VARCHAR(50),
      price DECIMAL(10, 2) DEFAULT 0.00,
      total_downloads INTEGER DEFAULT 0,
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  console.log('Clearing old data...');
  await sql`TRUNCATE TABLE marketplace_themes`;

  console.log('Inserting default theme...');
  await sql`
    INSERT INTO marketplace_themes (name, slug, description, image_url, download_url, author, version, category)
    VALUES (
      'Default Theme',
      'default',
      'The default clean, modern theme for NextjsCMS.',
      NULL,
      'https://npm.pkg.github.com/@nextjscms/theme-default/-/theme-default-1.0.1.tgz',
      'NextjsCMS',
      '1.0.1',
      'General'
    ) ON CONFLICT (slug) DO UPDATE 
      SET description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          version = EXCLUDED.version,
          download_url = EXCLUDED.download_url;
  `;

  console.log('Inserting bootstrap theme...');
  await sql`
    INSERT INTO marketplace_themes (name, slug, description, image_url, download_url, author, version, category)
    VALUES (
      'Bootstrap Theme',
      'bootstrap',
      'A classic Bootstrap inspired theme for NextjsCMS.',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Bootstrap_logo.svg/256px-Bootstrap_logo.svg.png',
      'https://npm.pkg.github.com/@nextjscms/theme-bootstrap/-/theme-bootstrap-1.0.2.tgz',
      'NextjsCMS',
      '1.0.2',
      'Corporate'
    ) ON CONFLICT (slug) DO UPDATE 
      SET description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          version = EXCLUDED.version,
          download_url = EXCLUDED.download_url;
  `;

  console.log('Successfully seeded database!');
}

seed().catch(console.error);
