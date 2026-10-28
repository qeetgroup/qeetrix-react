/** How Table reads a tree: each row's id, depth and whether it has rows inside it. */
export interface TableTree<Row> {
  rowId: (row: Row) => string;
  /** 0 at the top. */
  rowDepth: (row: Row) => number;
  rowHasChildren?: ((row: Row) => boolean) | undefined;
  /** The open rows' ids. */
  expanded: readonly string[];
}

/**
 * The rows a tree shows: `rows` in tree order (each parent, then the rows inside it), without the
 * rows inside a folded one. Table folds its rows with it; a server-paged list calls it to page the
 * rows that show.
 */
export function foldTreeRows<Row>(rows: readonly Row[], tree: TableTree<Row>): Row[] {
  const open = new Set(tree.expanded);
  const shown: Row[] = [];
  // The depth of the folded row whose descendants are being skipped, or -1.
  let folded = -1;
  for (const row of rows) {
    const depth = tree.rowDepth(row);
    if (folded >= 0 && depth > folded) continue;
    folded = -1;
    shown.push(row);
    if (tree.rowHasChildren?.(row) && !open.has(tree.rowId(row))) folded = depth;
  }
  return shown;
}

/** Each shown row's place among its siblings on the page, for `aria-posinset` and `aria-setsize`. */
export function treePositions(depths: readonly number[]): { position: number[]; size: number[] } {
  const parents: number[] = [];
  const parentOf: number[] = [];
  const position: number[] = [];
  const counts = new Map<number, number>();
  depths.forEach((depth, index) => {
    while (parents.length && (depths[parents[parents.length - 1] as number] ?? 0) >= depth) {
      parents.pop();
    }
    const parent = parents[parents.length - 1] ?? -1;
    const count = (counts.get(parent) ?? 0) + 1;
    counts.set(parent, count);
    parentOf[index] = parent;
    position[index] = count;
    parents.push(index);
  });
  return { position, size: parentOf.map((parent) => counts.get(parent) ?? 1) };
}
