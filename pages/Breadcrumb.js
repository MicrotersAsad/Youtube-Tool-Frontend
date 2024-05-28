// Breadcrumb.js
import Link from 'next/link';

const Breadcrumb = ({ blogTitle }) => {
  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <Link href="/blog">
            <p>Blog</p>
          </Link>
        </li>
        {blogTitle && (
          <li className="breadcrumb-item active" aria-current="page">
            {blogTitle}
          </li>
        )}
      </ol>
      <style jsx>{`
        .breadcrumb {
          display: flex;
          list-style: none;
          padding: 0;
        }
        .breadcrumb-item {
          margin-right: 0.5rem;
        }
        .breadcrumb-item + .breadcrumb-item::before {
          content: "/";
          margin-right: 0.5rem;
        }
      `}</style>
    </nav>
  );
};

export default Breadcrumb;
