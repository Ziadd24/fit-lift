import { Suspense } from "react";
import CoachesDirectory from "./CoachesDirectory";

export default async function CoachesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const lang = resolvedSearchParams.lang === "ar" ? "ar" : "en";
  const searchValue = resolvedSearchParams.search;
  const sortValue = resolvedSearchParams.sort;

  return (
    <Suspense fallback={null}>
      <CoachesDirectory
        lang={lang}
        initialSearch={typeof searchValue === "string" ? searchValue : ""}
        initialSort={sortValue === "desc" ? "desc" : "asc"}
      />
    </Suspense>
  );
}
