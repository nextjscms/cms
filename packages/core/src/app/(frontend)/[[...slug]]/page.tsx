import { getDb } from '@/db';
import { posts, pages, settings, postTypes } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getThemeComponent } from '@/themes/registry';

export default async function FrontendPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  const fullSlug = slugArray.length > 0 ? slugArray.join('/') : 'home'; 

  const db = getDb();
  
  const [activeThemeSetting] = await db.select().from(settings).where(eq(settings.key, 'activeTheme'));
  const activeTheme = activeThemeSetting?.value || 'default';
  
  let ThemeTemplate;
  let contentProps = {};
  
  let foundPost = null;
  let templateName = 'post';

  // 1. Check if it's a Custom Post Type (e.g. /product/my-product)
  if (slugArray.length > 1) {
    const potentialTypeSlug = slugArray[0];
    const potentialPostSlug = slugArray.slice(1).join('/');
    
    const [pt] = await db.select().from(postTypes).where(eq(postTypes.slug, potentialTypeSlug));
    if (pt) {
      const [p] = await db.select()
        .from(posts)
        .where(and(
          eq(posts.slug, potentialPostSlug),
          eq(posts.postTypeId, pt.id),
          eq(posts.status, 'published')
        ));
      
      if (p) {
        foundPost = p;
        templateName = pt.slug;
      }
    }
  }

  // 2. Check for standard Post (no prefix)
  if (!foundPost) {
    const [p] = await db.select()
      .from(posts)
      .where(and(
        eq(posts.slug, fullSlug),
        isNull(posts.postTypeId),
        eq(posts.status, 'published')
      ));
    if (p) {
      foundPost = p;
      templateName = 'post';
    }
  }

  // 3. Render Post or Fallback to Page
  if (foundPost) {
    ThemeTemplate = await getThemeComponent(activeTheme, templateName);
    contentProps = {
      title: foundPost.title,
      content: foundPost.content || '',
      date: new Date(foundPost.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      meta: foundPost.meta || {}
    };
  } else {
    const [page] = await db.select()
      .from(pages)
      .where(and(
        eq(pages.slug, fullSlug),
        eq(pages.status, 'published')
      ));

    if (page) {
      ThemeTemplate = await getThemeComponent(activeTheme, 'page');
      contentProps = {
        title: page.title,
        content: page.content || '',
        date: new Date(page.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      };
    } else {
      ThemeTemplate = await getThemeComponent(activeTheme, '404');
    }
  }

  return <ThemeTemplate {...contentProps} />;
}
