/** Client-safe helpers for printed lessons (no Node modules: the review page imports this). */

/**
 * The picture the app shows today at one position of a printed lesson (for the review page).
 * @param printed The package's `meta.printed`.
 * @param index The image index (0 = hero, 1 = paragraph 2, 2 = paragraph 3).
 * @returns The URL from the printed file, or the app's bucket path for the article.
 */
export function oldPictureUrl(printed: { articleId: string; imageUrls: string[] }, index: number): string {
    return printed.imageUrls[index] ?? `https://storage.googleapis.com/primary-app-storage/images/${printed.articleId}_${index + 1}.png`;
}
