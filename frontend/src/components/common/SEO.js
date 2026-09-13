import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SITE_NAME = 'Student Facility System';
const SITE_URL = 'https://sfs-fyp.vercel.app';

// Sets a page-specific browser title + meta description so each route is
// distinguishable to search engines and browser history, instead of every
// page sharing the single generic title/description from public/index.html.
const SEO = ({ title, description, noindex = false }) => {
  const { pathname } = useLocation();
  const canonicalUrl = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;

  return (
    <Helmet>
      <title>{title ? `${title} | ${SITE_NAME}` : SITE_NAME}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      {!noindex && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
};

export default SEO;
