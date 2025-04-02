import { MouseEvent, useState } from "react";
import Canvas from "./components/canvas";
import getFaces from "./lib/getFaces";

type Coordinates = { x: number; y: number };
export type Point = Coordinates & { id: number };
export type Edge = { from: number; to: number };

function distance({ from, to }: { from: Coordinates; to: Coordinates }) {
  const minX = Math.min(from.x, to.x);
  const maxX = Math.max(from.x, to.x);
  const minY = Math.min(from.y, to.y);
  const maxY = Math.max(from.y, to.y);

  const height = maxY - minY;
  const width = maxX - minX;

  return Math.sqrt(height ** 2 + width ** 2);
}

function distancePointToLine(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = y2 - y1;
  const B = x1 - x2;
  const C = x2 * y1 - y2 * x1;

  return Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
}

function arePointsSnapping({
  from,
  to,
}: {
  from: Coordinates;
  to: Coordinates;
}) {
  return distance({ from, to }) < 10;
}

function isPointSnappingEdge({
  point,
  edge,
  points,
}: {
  point: Coordinates;
  edge: Edge;
  points: Point[];
}) {
  const pointA = points.find(({ id }) => id === edge.from);
  const pointB = points.find(({ id }) => id === edge.to);

  if (!pointA || !pointB) return;

  const minX = Math.min(pointA.x, pointB.x);
  const maxX = Math.max(pointA.x, pointB.x);
  const minY = Math.min(pointA.y, pointB.y);
  const maxY = Math.max(pointA.y, pointB.y);

  const distance = distancePointToLine(
    point.x,
    point.y,
    pointA.x,
    pointA.y,
    pointB.x,
    pointB.y
  );

  return (
    distance < 10 &&
    point.x >= minX &&
    point.x <= maxX &&
    point.y >= minY &&
    point.y <= maxY
  );
}

function getSnappingPointToEdge({
  point,
  edge,
  points,
}: {
  point: Coordinates;
  edge: Edge;
  points: Point[];
}) {
  const e1 = points.find((point) => point.id === edge.from);
  const e2 = points.find((point) => point.id === edge.to);

  if (!e1 || !e2) return { id: Math.random(), x: point.x, y: point.y };

  const m = (e2.y - e1.y) / (e2.x - e1.x);

  // f(x) = y = mx + b (edge line equation)
  // b = y - mx

  const b = e1.y - m * e1.x;

  // normal line (perpendicular to edge)
  // g(x) = y = nx + c
  // c = y - nx
  const n = -1 / m;

  const c = point.y - n * point.x;

  // now we'll intersect the lines
  // f(x) = g(x)
  // mx + b = nx + c
  // x(m-n) = c-b
  // x = (c-b) / (m-n)

  const snapX = (c - b) / (m - n);

  // and finally we get snapY by putting snapX in either of the lines
  // snapY = f(snapX) = m * snapX + b

  const snapY = m * snapX + b;

  return {
    id: Math.random(),
    x: snapX,
    y: snapY,
  };
}

function App() {
  const [tool, setTool] = useState<"default" | "line">("line");

  const [cursor, setCursor] = useState<Coordinates>({
    x: 0,
    y: 0,
  });
  const [points, setPoints] = useState<Point[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [faces, setFaces] = useState<Edge[][]>([]);

  const [currentPoint, setCurrentPoint] = useState<Point | undefined>();

  // useEffect(() => {
  //   setEdges([
  //     { from: 1, to: 2 },
  //     { from: 2, to: 3 },
  //     { from: 3, to: 1 },
  //   ]);
  // }, []);

  const handleMouseMove = ({
    clientX,
    clientY,
  }: MouseEvent<HTMLDivElement>) => {
    setCursor({ x: clientX, y: clientY });
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    switch (tool) {
      case "line":
        handleDrawLine(event);
        break;

      default:
        break;
    }
  };

  function edge({ from, to }: { from?: Point; to: Point }) {
    if (from) {
      setEdges((prev) => [...prev, { from: from.id, to: to.id }]);
      setCurrentPoint(undefined);
    } else {
      setCurrentPoint(to);
    }
  }

  function face(edge: Edge) {
    const faces = getFaces(edges, edge);
    setFaces((f) => [...f, ...faces]);
  }

  function addPoint(point: Point) {
    setPoints((prev) => [...prev, point]);
  }

  const handleDrawLine = (event: MouseEvent<HTMLDivElement>) => {
    const pointUnderCursor = {
      x: event.clientX,
      y: event.clientY,
      id: Math.random(),
    };

    const snappingPoint = points.find((v) =>
      arePointsSnapping({ from: v, to: pointUnderCursor })
    );

    const snappingEdge = edges.find((edge) =>
      isPointSnappingEdge({ point: pointUnderCursor, edge, points })
    );

    if (snappingPoint) {
      edge({ from: currentPoint, to: snappingPoint });
      if (currentPoint) face({ from: currentPoint.id, to: snappingPoint.id });
      return;
    }
    if (snappingEdge) {
      const snappingPointToEdge = getSnappingPointToEdge({
        point: pointUnderCursor,
        edge: snappingEdge,
        points,
      });
      addPoint(snappingPointToEdge);
      edge({ from: currentPoint, to: snappingPointToEdge });
      if (currentPoint) {
        face({ from: currentPoint.id, to: snappingPointToEdge.id });
      }
      return;
    }

    addPoint(pointUnderCursor);
    edge({ from: currentPoint, to: pointUnderCursor });
    if (currentPoint) face({ from: currentPoint.id, to: pointUnderCursor.id });
  };

  const cursorPoint = { ...cursor, id: -1 };

  const coloredPoints = points.map((point) => {
    const isSnapping = arePointsSnapping({ from: point, to: cursor });
    const isCurrent = currentPoint && point.id === currentPoint.id;

    return {
      ...point,
      color: isSnapping ? "yellow" : isCurrent ? "green" : "black",
    };
  });

  const snappingPointToPoint = points.find((p) =>
    arePointsSnapping({ from: p, to: cursorPoint })
  );

  const snappingPointToEdge = edges
    .filter((edge) => isPointSnappingEdge({ edge, point: cursor, points }))
    .map((edge) => getSnappingPointToEdge({ point: cursor, edge, points }))[0]; // TODO: set the one that's closer

  const snappingPoint = snappingPointToPoint || snappingPointToEdge; // TODO: set the one that's closer

  const edgesWithCursor = currentPoint
    ? [
        ...edges,
        {
          from: currentPoint.id,
          to: snappingPoint ? snappingPoint.id : cursorPoint.id,
        },
      ]
    : edges;

  const coloredEdges = edgesWithCursor.map((edge) => ({
    ...edge,
    color: isPointSnappingEdge({ point: cursorPoint, edge, points })
      ? "orange"
      : "white",
  }));

  return (
    <div onMouseMove={handleMouseMove} onClick={handleClick}>
      <div
        style={{
          position: "fixed",
          background: "white",
        }}
      >
        {tool}
        <button
          onClick={(event) => {
            setTool("line");
            event.stopPropagation();
          }}
        >
          line
        </button>
      </div>
      <Canvas
        points={[
          ...coloredPoints,
          ...(snappingPoint ? [] : [{ ...cursorPoint, color: "yellow" }]),
          ...(snappingPointToEdge
            ? [{ ...snappingPointToEdge, color: "red" }]
            : []),
        ]}
        edges={coloredEdges}
        faces={faces}
      />
    </div>
  );
}

export default App;
