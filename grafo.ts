type Edge = {
	from: string
	to: string
}

function esCara(camino: Edge[]) {
	if (camino.length === 0) return false;
	const primero = camino[0];
	const ultimo = camino[camino.length - 1];

	const haceBucle = ultimo.to === primero.from || ultimo.from === primero.to;

	console.log('esCara', { camino, length: camino.length, haceBucle, noHayRepetidos: noHayRepetidos(camino), condition: haceBucle && camino.length >= 3 && noHayRepetidos(camino) })

	return haceBucle && camino.length >= 3 && noHayRepetidos(camino)
}



function noHayRepetidos(camino: Edge[]) {
	const vertices = camino.flatMap(({ from, to }) => [from, to])

	return vertices.every(vertice => {
		const count = vertices.filter((v) => vertice === v).length

		return count === 2
	})

}
function obtenerCaminos(
	aristas: Edge[],
	arista: Edge,
	camino: Edge[]
): Edge[][] {
	const actual = arista;

	const siguientes = aristas.filter(
		(x) => {
			const esSiguiente =
				x.from === actual.to ||
				x.to === actual.from ||
				x.from === actual.from ||
				x.to === actual.to
			const esLaMisma = x.from == actual.from && x.to === arista.to
			const yaLoRecorri = camino.some(arista => arista.from === x.from && arista.to === x.to)
			return esSiguiente && !yaLoRecorri && !esLaMisma

		}
	);

	if (siguientes.length == 0) {
		return [[...camino, arista]]
	}

	const acc: Edge[][] = [];

	for (const siguiente of siguientes) {

		const nuevoCamino = [...camino, arista]

		if (esCara(nuevoCamino)) {
			acc.push(nuevoCamino)
			continue
		}

		const nuevosCaminos = obtenerCaminos(aristas, siguiente, nuevoCamino);
		acc.push(...nuevosCaminos);
	}

	return acc;
}
const edges = [{ from: 'b', to: 'a' }, { from: 'c', to: 'b' }, { from: 'c', to: 'a' }, { from: 'c', to: 'd' }]

const caminos = obtenerCaminos(edges, edges[0], [])

function edgeToString(edge: Edge) {
	return `${edge.from.toUpperCase()}${edge.to.toUpperCase()}`
}

const faces = caminos.filter((camino) =>
	esCara(camino)
)


console.log({ caminos: caminos.map(camino => camino.map(edgeToString)), faces: faces.map(camino => camino.map(edgeToString)) }, { depth: null })