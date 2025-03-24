import { MouseEvent, useEffect, useRef, useState } from "react";

type Coordinates = { x: number; y: number };
type Point = Coordinates & { id: number };
type Edge = { from: number; to: number };

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
  point: Point;
  edge: Edge;
  points: Point[];
}) {
  const pointA = points.find(({ id }) => id === edge.from);
  const pointB = points.find(({ id }) => id === edge.to);

  if (!pointA || !pointB) return;

  return (
    distancePointToLine(
      point.x,
      point.y,
      pointA.x,
      pointA.y,
      pointB.x,
      pointB.y
    ) < 10
  );
}

function App() {
  const [points, setPoints] = useState<Point[]>([
    {
      x: 243,
      y: 672,
      id: 1,
    },
    {
      x: 614,
      y: 227,
      id: 2,
    },
    {
      x: 819,
      y: 667,
      id: 3,
    },
    {
      x: 1162,
      y: 811,
      id: 4,
    },
  ]);

  const [tool, setTool] = useState<"default" | "line">("line");
  const [edges, setEdges] = useState<Edge[]>([]);
  const [cursor, setCursor] = useState<Coordinates>({
    x: 0,
    y: 0,
  });

  const [currentPoint, setCurrentPoint] = useState<Point | undefined>();

  useEffect(() => {
    setEdges([
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 1 },
    ]);
  }, []);

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

  const handleDrawLine = (event: MouseEvent<HTMLDivElement>) => {
    const pointUnderClick = {
      x: event.clientX,
      y: event.clientY,
      id: Math.random(),
    };

    const snappingPoint = points.find((v) =>
      arePointsSnapping({ from: v, to: pointUnderClick })
    );

    const snappingEdge = edges.find((edge) =>
      isPointSnappingEdge({ point: pointUnderClick, edge, points })
    );

    if (snappingEdge) {
      //
    }

    if (snappingPoint) {
      edge({ from: currentPoint, to: snappingPoint });
      return;
    }
    setPoints((prev) => [...prev, pointUnderClick]);
    edge({ from: currentPoint, to: pointUnderClick });
  };

  const cursorPoint = { ...cursor, id: -1 };

  const coloredVertices = points.map((point) => {
    const isSnapping = arePointsSnapping({ from: point, to: cursor });
    const isCurrent = currentPoint && point.id === currentPoint.id;

    return {
      ...point,
      color: isSnapping ? "yellow" : isCurrent ? "green" : "black",
    };
  });

  const snappingPoint = points.find((p) =>
    arePointsSnapping({ from: p, to: cursorPoint })
  );

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
          ...coloredVertices,
          ...(snappingPoint ? [] : [{ ...cursorPoint, color: "yellow" }]),
        ]}
        edges={coloredEdges}
      />
    </div>
  );
}

type ColoredPoint = Point & { color: string };
type ColoredEdge = Edge & { color: string };

function Canvas({
  points,
  edges,
}: {
  points: ColoredPoint[];
  edges: ColoredEdge[];
}) {
  console.log(points);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.reset();
  }

  function getCanvasContext() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return canvas.getContext("2d");
  }

  function drawPoint({ x, y, color }: { x: number; y: number; color: string }) {
    const ctx = getCanvasContext();
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.fillRect(x - 12, y - 12, 6, 6);
  }

  function drawEdge(edge: ColoredEdge) {
    const { from, to } = edge;

    const fromPoint = points.find((point) => point.id === from);
    const toPoint = points.find((point) => point.id === to);

    if (!fromPoint || !toPoint) return;

    const ctx = getCanvasContext();
    if (!ctx) return;

    ctx.strokeStyle = edge.color;

    ctx.beginPath();
    ctx.moveTo(fromPoint.x - 10, fromPoint.y - 10);
    ctx.lineTo(toPoint.x - 10, toPoint.y - 10);
    ctx.stroke();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  clearCanvas();
  for (const point of points) {
    drawPoint(point);
  }
  for (const edge of edges) {
    drawEdge(edge);
  }

  return (
    <canvas
      style={{
        backgroundColor: "black",
      }}
      ref={canvasRef}
    ></canvas>
  );
}

export default App;
