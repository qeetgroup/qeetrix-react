/**
 * Resolves once every finite transition and animation has finished, so a test reads end states:
 * an overlay fully faded in, not halfway. Infinite ones, such as a spinner's turn, are skipped.
 */
export async function settled(): Promise<void> {
  await Promise.all(
    document
      .getAnimations()
      .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
      // A cancelled animation (its element re-rendered or removed) rejects; it's settled too.
      .map((animation) => animation.finished.catch(() => undefined)),
  );
}
