/**
 * SEO 및 접근성을 위한 페이지 제목 컴포넌트
 */
import { Helmet } from "react-helmet-async";

interface PageTitleProps {
  title: string;
  description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  const fullTitle = `${title} | 성남시 개발 톡톡`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
    </Helmet>
  );
}
