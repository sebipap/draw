import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import Canvas from "./components/canvas";
import {
  arePointsSnapping,
  getFaces,
  getSnappingPointToEdge,
  isPointSnappingEdge,
} from "./lib/math";

export type Coordinates = { x: number; y: number };
export type Point = Coordinates & { id: number };
export type Edge = { from: number; to: number };
export type Face = {
  edges: Edge[];
  id: number;
};

function App() {
  const [cursor, setCursor] = useState<Coordinates>({
    x: 0,
    y: 0,
  });
  const [points, setPoints] = useState<Point[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [faces, setFaces] = useState<Face[]>([]);
  const [currentPoint, setCurrentPoint] = useState<Point | undefined>();
  const lastIdRef = useRef(0);
  const [tool, setTool] = useState<"rectangle" | "line" | "move">("rectangle");
  const [isMoving, setIsMoving] = useState(false);
  const [displacementStart, setDisplacementStart] = useState<
    Coordinates | undefined
  >({ x: 0, y: 0 });
  const [displacementEnd, setDisplacementEnd] = useState({
    x: 0,
    y: 0,
  });
  const [displacement, setDisplacement] = useState({ x: 0, y: 0 });

  function getId() {
    lastIdRef.current++;
    return lastIdRef.current;
  }

  function drawCurrentEdge({ from, to }: { from?: Point; to: Point }) {
    if (from) {
      setEdges((prev) => [...prev, { from: from.id, to: to.id }]);
      setCurrentPoint(undefined);
    } else {
      setCurrentPoint(to);
    }
  }

  function addFace(face: Face) {
    setFaces((prev) => [...prev, face]);
  }

  function drawCurrentRectangle({ from, to }: { from?: Point; to: Point }) {
    // instead of directly from=>to
    // from: (x1,y1)
    // to: (x2, y2)
    //we'll do
    // (x1, y1) => (x1, y2)
    // (x1, y1) => (x2, y1)
    //

    if (from) {
      // D    / C
      //     /
      //    /
      // A /    B

      const aId = from.id;

      const bId = getId();
      const bPoint = {
        id: bId,
        x: to.x,
        y: from.y,
      };

      const cId = to.id;

      const dId = getId();
      const dPoint = {
        id: dId,
        x: from.x,
        y: to.y,
      };

      addPoint(bPoint);
      addPoint(dPoint);

      const face = [
        { from: aId, to: bId },
        { from: bId, to: cId },
        { from: cId, to: dId },
        { from: dId, to: aId },
      ];

      setEdges((prev) => [...prev, ...face]);
      addFace({
        edges: face,
        id: getId(),
      });
      setCurrentPoint(undefined);
    } else {
      setCurrentPoint(to);
    }
  }

  function addEdge(edge: Edge) {
    setEdges((prev) => [...prev, edge]);
  }

  function deleteEdge({ from, to }: Edge) {
    setEdges((prev) =>
      prev.filter((edge) => edge.from !== from || edge.to !== to)
    );
  }

  function face(edge: Edge) {
    const faces = getFaces(edges, edge);
    console.log({ faces });
    const smallestFace = faces.sort((a, b) => a.length - b.length)[0];
    const id = getId();
    if (!smallestFace) return;

    setFaces((prev) => {
      return [
        ...prev,
        {
          edges: smallestFace,
          id,
        },
      ];
    });
  }

  function addPoint(point: Point) {
    setPoints((prev) => [...prev, point]);
  }

  const handleDrawLine = () => {
    const pointUnderCursor = {
      ...cursor,
      id: getId(),
    };

    const snappingPoint = points.find((v) =>
      arePointsSnapping({ from: v, to: pointUnderCursor })
    );

    const snappingEdge = edges.find((edge) =>
      isPointSnappingEdge({ point: pointUnderCursor, edge, points })
    );

    if (snappingPoint) {
      drawCurrentEdge({ from: currentPoint, to: snappingPoint });
      if (currentPoint) face({ from: currentPoint.id, to: snappingPoint.id });
      return;
    }
    if (snappingEdge) {
      const snappingPointToEdge = getSnappingPointToEdge({
        point: pointUnderCursor,
        edge: snappingEdge,
        points,
        getId,
      });
      addPoint(snappingPointToEdge);
      drawCurrentEdge({ from: currentPoint, to: snappingPointToEdge });
      // tambien vamos a partir la arista original en el punto de snapping
      // para eso vamos a borrar la arista original y crear dos en su lugar
      deleteEdge(snappingEdge);
      addEdge({
        from: snappingEdge.from,
        to: snappingPointToEdge.id,
      });
      addEdge({
        from: snappingPointToEdge.id,
        to: snappingEdge.to,
      });

      if (currentPoint) {
        face({ from: currentPoint.id, to: snappingPointToEdge.id });
      }
      return;
    }

    addPoint(pointUnderCursor);
    drawCurrentEdge({ from: currentPoint, to: pointUnderCursor });
    if (currentPoint) face({ from: currentPoint.id, to: pointUnderCursor.id });
  };

  const cursorPoint = useMemo(
    () => ({
      ...cursor,
      id: -1,
      x: cursor.x + displacement.x,
      y: cursor.y + displacement.y,
    }),
    [cursor, displacement.x, displacement.y]
  );

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
    .map((edge) =>
      getSnappingPointToEdge({ point: cursor, edge, points, getId })
    )[0]; // TODO: set the one that's closer

  const snappingPoint = snappingPointToPoint || snappingPointToEdge; // TODO: set the one that's closer

  const currentRectanglePoints = useMemo(() => {
    if (!currentPoint || tool !== "rectangle") return [];

    const a = currentPoint;
    const c = cursor;

    const x1 = a.x;
    const y1 = a.y;

    const x2 = c.x;
    const y2 = c.y;

    const d = {
      id: -2,
      x: x1,
      y: y2,
      color: "yellow",
    };

    const b = {
      id: -3,
      x: x2,
      y: y1,
      color: "yellow",
    };

    return [d, b];
  }, [currentPoint, cursor, tool]);

  const edgesWithCursor = useMemo(() => {
    const [d, b] = currentRectanglePoints;
    const a = currentPoint;
    const c = cursorPoint;

    if (!a) return edges;
    if (tool === "rectangle") {
      return [
        ...edges,
        { from: a.id, to: b.id },
        { from: b.id, to: c.id },
        { from: c.id, to: d.id },
        { from: d.id, to: a.id },
      ];
    }

    return [
      ...edges,
      {
        from: currentPoint.id,
        to: snappingPoint ? snappingPoint.id : cursorPoint.id,
      },
    ];
  }, [
    currentPoint,
    currentRectanglePoints,
    cursorPoint,
    edges,
    snappingPoint,
    tool,
  ]);

  const coloredEdges = edgesWithCursor.map((edge) => ({
    ...edge,
    color: isPointSnappingEdge({ point: cursorPoint, edge, points })
      ? "orange"
      : "white",
  }));

  const handleDrawRectangle = (event: MouseEvent<HTMLDivElement>) => {
    const pointUnderCursor = {
      x: event.clientX,
      y: event.clientY,
      id: getId(),
    };

    const snappingPoint = points.find((v) =>
      arePointsSnapping({ from: v, to: pointUnderCursor })
    );

    const snappingEdge = edges.find((edge) =>
      isPointSnappingEdge({ point: pointUnderCursor, edge, points })
    );

    if (snappingPoint) {
      drawCurrentRectangle({ from: currentPoint, to: snappingPoint });
      if (currentPoint) face({ from: currentPoint.id, to: snappingPoint.id });
      return;
    }
    if (snappingEdge) {
      const snappingPointToEdge = getSnappingPointToEdge({
        point: pointUnderCursor,
        edge: snappingEdge,
        points,
        getId,
      });
      addPoint(snappingPointToEdge);
      drawCurrentRectangle({ from: currentPoint, to: snappingPointToEdge });
      // tambien vamos a partir la arista original en el punto de snapping
      // para eso vamos a borrar la arista original y crear dos en su lugar
      deleteEdge(snappingEdge);
      addEdge({
        from: snappingEdge.from,
        to: snappingPointToEdge.id,
      });
      addEdge({
        from: snappingPointToEdge.id,
        to: snappingEdge.to,
      });

      if (currentPoint) {
        face({ from: currentPoint.id, to: snappingPointToEdge.id });
      }
      return;
    }

    addPoint(pointUnderCursor);
    drawCurrentRectangle({ from: currentPoint, to: pointUnderCursor });
    if (currentPoint) face({ from: currentPoint.id, to: pointUnderCursor.id });
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    switch (tool) {
      case "line":
        handleDrawLine(event);
        break;
      case "rectangle":
        handleDrawRectangle(event);
        break;
      case "move":
        break;
      // nothing here, tracking in mousemove, mousedown, mouseup
      default:
        break;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "l") {
        setTool("line");
      }
      if (event.key === "r") {
        setTool("rectangle");
      }
      if (event.key === "h") {
        setTool("move");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMouseMove = ({
    clientX,
    clientY,
  }: MouseEvent<HTMLDivElement>) => {
    if (tool === "move" && isMoving) {
      setDisplacementEnd({
        x: clientX,
        y: clientY,
      });
    }
    setCursor({ x: clientX, y: clientY });
  };

  const handleMouseDown = ({
    clientX,
    clientY,
  }: MouseEvent<HTMLDivElement>) => {
    if (tool !== "move") return;
    setIsMoving(true);
    setDisplacementStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => {
    if (tool !== "move") return;
    setIsMoving(false);
    if (displacementStart) {
      setDisplacement({
        x: displacement.x + (displacementEnd.x - displacementStart.x),
        y: displacement.y + (displacementEnd.y - displacementStart.y),
      });
    }
    setDisplacementStart(undefined);
  };

  const absolutePoints = [
    ...coloredPoints,
    ...(snappingPoint ? [] : [{ ...cursorPoint, color: "yellow" }]),
    ...(snappingPointToEdge ? [{ ...snappingPointToEdge, color: "red" }] : []),
    ...currentRectanglePoints,
  ];

  const displacedPoints = absolutePoints.map((point) => {
    if (point.id == -1) return point;
    if (displacementStart) {
      return {
        ...point,
        x: point.x + displacement.x + displacementEnd.x - displacementStart.x,
        y: point.y + displacement.y + displacementEnd.y - displacementStart.y,
      };
    }

    return {
      ...point,
      x: point.x + displacement.x,
      y: point.y + displacement.y,
    };
  });

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <Canvas points={displacedPoints} edges={coloredEdges} faces={faces} />
    </div>
  );
}

export default App;
