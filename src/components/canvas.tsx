import { useEffect, useRef } from "react";
import { Edge, Point } from "../App";
import { edgesToPoints } from "../lib/getFaces";

type ColoredPoint = Point & { color: string };
type ColoredEdge = Edge & { color: string };

export default function Canvas({
  points,
  edges,
  faces,
}: {
  points: ColoredPoint[];
  edges: ColoredEdge[];
  faces: Edge[][];
}) {
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

  function drawFace(face: Edge[]) {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const coords = edgesToPoints(face)
      .map((id) => points.find((point) => point.id === id))
      .filter((x) => !!x);

    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (const coord of coords) {
      ctx.lineTo(coord.x, coord.y);
    }
    ctx.closePath();
    ctx.fill();
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

  for (const face of faces) {
    drawFace(face);
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
