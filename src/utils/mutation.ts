type MutationNodeList = NodeList | readonly Node[];

type MutationRecordLike = {
  addedNodes: MutationNodeList;
  removedNodes: MutationNodeList;
};

function asRelevantElement(node: Node | null): Element | null {
  if (!node) {
    return null;
  }

  if (node instanceof Element) {
    return node;
  }

  return node.parentElement;
}

function matchesDeep(element: Element, selectors: readonly string[]): boolean {
  return selectors.some((selector) => element.matches(selector) || element.querySelector(selector));
}

function isIgnored(element: Element, selectors: readonly string[]): boolean {
  return selectors.some((selector) => element.matches(selector) || element.closest(selector));
}

function nodeListTouchesSelectors(
  nodes: MutationNodeList,
  relevantSelectors: readonly string[],
  ignoredSelectors: readonly string[]
): boolean {
  for (const node of Array.from(nodes)) {
    const element = asRelevantElement(node);
    if (!element || isIgnored(element, ignoredSelectors)) {
      continue;
    }

    if (matchesDeep(element, relevantSelectors)) {
      return true;
    }
  }

  return false;
}

export function mutationsTouchSelectors(
  records: readonly MutationRecordLike[],
  relevantSelectors: readonly string[],
  ignoredSelectors: readonly string[] = []
): boolean {
  return records.some(
    (record) =>
      nodeListTouchesSelectors(record.addedNodes, relevantSelectors, ignoredSelectors) ||
      nodeListTouchesSelectors(record.removedNodes, relevantSelectors, ignoredSelectors)
  );
}
