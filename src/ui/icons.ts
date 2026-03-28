const SVG_NS = "http://www.w3.org/2000/svg";

function createSvg(viewBox: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}

function createPath(pathData: string): SVGPathElement {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathData);
  return path;
}

function createCircle(cx: number, cy: number, radius: number): SVGCircleElement {
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", String(cx));
  circle.setAttribute("cy", String(cy));
  circle.setAttribute("r", String(radius));
  return circle;
}

function createPolyline(points: string): SVGPolylineElement {
  const polyline = document.createElementNS(SVG_NS, "polyline");
  polyline.setAttribute("points", points);
  return polyline;
}

export function createSponsorShieldIcon(): SVGSVGElement {
  const svg = createSvg("0 0 24 24");

  const outer = createPath(
    "M12 2.2c3.88 0 7.26 2.62 8.2 6.37.66 2.66-.06 5.55-1.95 7.59a9.83 9.83 0 0 1-6.25 3.16 9.7 9.7 0 0 1-8.46-3.64 9.42 9.42 0 0 1-1.76-7.17A9.87 9.87 0 0 1 12 2.2Z"
  );
  outer.setAttribute("fill", "none");
  outer.setAttribute("stroke", "currentColor");
  outer.setAttribute("stroke-width", "1.7");
  outer.setAttribute("stroke-linejoin", "round");

  const play = createPath("M10.1 8.4 15.6 12l-5.5 3.6Z");
  play.setAttribute("fill", "currentColor");

  const orbit = createCircle(17.55, 17.1, 2.15);
  orbit.setAttribute("fill", "none");
  orbit.setAttribute("stroke", "currentColor");
  orbit.setAttribute("stroke-width", "1.7");

  const spark = createPolyline("17.55 15.95 17.55 18.25 17.55 15.95 15.95 17.1 19.15 17.1");
  spark.setAttribute("fill", "none");
  spark.setAttribute("stroke", "currentColor");
  spark.setAttribute("stroke-width", "1.45");
  spark.setAttribute("stroke-linecap", "round");
  spark.setAttribute("stroke-linejoin", "round");

  svg.append(outer, play, orbit, spark);
  return svg;
}

export function createThumbIcon(direction: "up" | "down"): SVGSVGElement {
  const svg = createSvg("0 0 24 24");
  if (direction === "up") {
    svg.appendChild(
      createPath(
        "M2 21h4V9H2v12Zm20-11.5c0-1.1-.9-2-2-2h-6.3l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 6.59 7.59C6.22 7.95 6 8.45 6 9v10c0 1.1.9 2 2 2h9c.82 0 1.53-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2.5Z"
      )
    );
  } else {
    svg.appendChild(
      createPath(
        "M15 3H6c-.82 0-1.53.5-1.84 1.22L1.14 11.27C1.05 11.5 1 11.74 1 12v2.5c0 1.1.9 2 2 2h6.3l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2Zm4 0v12h4V3h-4Z"
      )
    );
  }
  return svg;
}

export function createCogIcon(): SVGSVGElement {
  const svg = createSvg("0 0 24 24");
  svg.appendChild(
    createPath(
      "M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.65l-1.92-3.32a.5.5 0 0 0-.61-.22l-2.39.96a7.17 7.17 0 0 0-1.63-.94l-.36-2.54A.49.49 0 0 0 13.89 2h-3.78a.49.49 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.61.22L2.71 8.48a.5.5 0 0 0 .12.65l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.65l1.92 3.32c.13.22.39.31.61.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.05.24.25.42.49.42h3.78c.24 0 .44-.18.49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.22.09.48 0 .61-.22l1.92-3.32a.5.5 0 0 0-.12-.65l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z"
    )
  );
  return svg;
}

export function createProfileIcon(): SVGSVGElement {
  const svg = createSvg("0 0 24 24");
  const head = createCircle(12, 8.2, 3.2);
  head.setAttribute("fill", "none");
  head.setAttribute("stroke", "currentColor");
  head.setAttribute("stroke-width", "1.8");

  const shoulders = createPath("M5.2 19.4c.75-3.55 3.53-5.4 6.8-5.4 3.26 0 6.04 1.85 6.8 5.4");
  shoulders.setAttribute("fill", "none");
  shoulders.setAttribute("stroke", "currentColor");
  shoulders.setAttribute("stroke-width", "1.8");
  shoulders.setAttribute("stroke-linecap", "round");
  shoulders.setAttribute("stroke-linejoin", "round");

  svg.append(head, shoulders);
  return svg;
}

export function createCloseIcon(): SVGSVGElement {
  const svg = createSvg("0 0 24 24");
  const left = document.createElementNS(SVG_NS, "line");
  left.setAttribute("x1", "18");
  left.setAttribute("y1", "6");
  left.setAttribute("x2", "6");
  left.setAttribute("y2", "18");
  left.setAttribute("stroke", "currentColor");
  left.setAttribute("stroke-width", "2.5");
  left.setAttribute("stroke-linecap", "round");
  left.setAttribute("stroke-linejoin", "round");

  const right = document.createElementNS(SVG_NS, "line");
  right.setAttribute("x1", "6");
  right.setAttribute("y1", "6");
  right.setAttribute("x2", "18");
  right.setAttribute("y2", "18");
  right.setAttribute("stroke", "currentColor");
  right.setAttribute("stroke-width", "2.5");
  right.setAttribute("stroke-linecap", "round");
  right.setAttribute("stroke-linejoin", "round");

  svg.append(left, right);
  return svg;
}
