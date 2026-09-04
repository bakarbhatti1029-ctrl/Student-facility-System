import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Student Facility System';

// Sets a page-specific browser title + meta description so each route is
// distinguishable to search engines and browser history, instead of every
// page sharing the single generic title/description from public/index.html.
const SEO = ({ title, description }) => (
  <Helmet>
    <title>{title ? `${title} | ${SITE_NAME}` : SITE_NAME}</title>
    {description && <meta name="description" content={description} />}
  </Helmet>
);

export default SEO;
