import { mediaUrl } from "@/lib/media-url";
import { Link } from "@tanstack/react-router";
import type { FC, ReactNode } from "react";

type CompanyLike = {
  id: string;
  slug: string;
  image_url?: string | null;
  founded_date?: string | null;
  link_type?: string | null;
  link_url?: string | null;
};

type Props = {
  company: CompanyLike;
  title: string;
  tagline?: string | undefined;
  dateLabel?: string | undefined;
  actionLabel: string;
  children?: ReactNode;
};

/**
 * Horizontal (rectangular) card: image + title + date.
 * The destination is customizable from the dashboard: an internal page
 * (link_url starting with "/"), an external URL, or the company detail page.
 */
export function CompanyCard({ company, title, tagline, dateLabel, actionLabel, children }: Props) {
  const url = company.link_url?.trim() || "";
  const isExternal = company.link_type === "external" && /^https?:\/\//i.test(url);
  const isInternal = company.link_type === "internal" && url.startsWith("/");

  const body = (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-0 sm:grid-cols-[14rem_minmax(0,1fr)]">
      {company.image_url ? (
        <img
          src={mediaUrl(company.image_url)}
          alt={title}
          className="h-44 w-full object-cover sm:h-full"
          loading="lazy"
        />
      ) : (
        <div className="h-44 w-full bg-surface sm:h-full" aria-hidden="true" />
      )}
      <div className="min-w-0 p-6">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {tagline ? <p className="mt-1 text-sm text-primary-glow">{tagline}</p> : null}
        {children}
        {dateLabel ? <p className="mt-3 text-xs text-muted-foreground">{dateLabel}</p> : null}
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary-glow group-hover:underline">
          {actionLabel}
        </span>
      </div>
    </div>
  );

  const shell =
    "group card-elevated block overflow-hidden transition-colors hover:border-primary-glow";

  if (isExternal) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={shell}>
        {body}
      </a>
    );
  }

  if (isInternal) {
    const AnyLink = Link as unknown as FC<{
      to: string;
      className?: string;
      children?: ReactNode;
    }>;
    return (
      <AnyLink to={url} className={shell}>
        {body}
      </AnyLink>
    );
  }

  return (
    <Link to="/companies/$slug" params={{ slug: company.slug }} className={shell}>
      {body}
    </Link>
  );
}
