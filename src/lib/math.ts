import { Coordinates, Edge, Point } from "../App";

function isFace(path: Edge[]) {
	if (path.length === 0) return false;
	const first = path[0];
	const last = path[path.length - 1];

	const loops = last.to === first.from || last.from === first.to;
	return loops && path.length >= 3 && !hasRepeats(path)
}

function hasRepeats(path: Edge[]) {
	const points = path.flatMap(({ from, to }) => [from, to])

	return points.some(vertice => {
		const count = points.filter((v) => vertice === v).length
		return count !== 2
	})

}

function getPaths(
	edges: Edge[],
	fromEdge: Edge,
	path: Edge[],

): Edge[][] {
	const current = fromEdge;
	console.log(edgesToPoints(path))

	const nextEdges = edges.filter(
		(x) => {
			const isNext =
				x.from === current.to ||
				x.to === current.from ||
				x.from === current.from ||
				x.to === current.to
			const itsItself = x.from == current.from && x.to === fromEdge.to
			const alreadyInPath = path.some(arista => arista.from === x.from && arista.to === x.to)
			return isNext && !alreadyInPath && !itsItself

		}
	);

	if (nextEdges.length === 0) {
		return [[...path, fromEdge]]
	}

	const paths: Edge[][] = [];

	for (const nextEdge of nextEdges) {

		const newPath = [...path, fromEdge]

		// if (hasRepeats(newPath)) continue

		if (isFace(newPath)) {
			paths.push(newPath)
		} else {
			const newPaths = getPaths(edges, nextEdge, newPath);
			paths.push(...newPaths);
		}
	}

	return paths;
}

export function edgesToPoints(edges: Edge[]) {
	const points1 = edges.flatMap(({ from, to }) => [from, to])

	// points1 has duplicates
	const points2 = [...new Set(points1)]

	return points2
}

export function getFaces(edges: Edge[], edge: Edge) {
	const paths = getPaths(edges, edge, [])
	return paths.filter(isFace)
}

export function distance({ from, to }: { from: Coordinates; to: Coordinates }) {
	const minX = Math.min(from.x, to.x);
	const maxX = Math.max(from.x, to.x);
	const minY = Math.min(from.y, to.y);
	const maxY = Math.max(from.y, to.y);

	const height = maxY - minY;
	const width = maxX - minX;

	return Math.sqrt(height ** 2 + width ** 2);
}

export function distancePointToLine(
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

export function arePointsSnapping({
	from,
	to,
}: {
	from: Coordinates;
	to: Coordinates;
}) {
	return distance({ from, to }) < 10;
}

export function isPointSnappingEdge({
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

export function getSnappingPointToEdge({
	point,
	edge,
	points,
	getId
}: {
	point: Coordinates;
	edge: Edge;
	points: Point[];
	getId: () => number
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
		id: getId(),
		x: snapX,
		y: snapY,
	};
}