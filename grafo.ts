type Edge = {
	from: string
	to: string
}

function haceBucle(camino: Edge[]) {
	if (camino.length === 0) return false;
	const primero = camino[0];
	const ultimo = camino[camino.length - 1];

	return ultimo.to === primero.from || ultimo.from === primero.to;
}

function obtenerCaminos(
	aristas: Edge[],
	arista: Edge,
	camino: Edge[]
): Edge[][] {
	console.log('obtenerCaminos')
	console.log({ aristas, arista, camino })

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

	console.log({ siguientes })

	if (siguientes.length == 0) {
		return [[...camino, arista]]
	}

	// console.dir({ aristas, actual, siguientes }, { depth: null })

	const acc: Edge[][] = [];

	for (const siguiente of siguientes) {

		const nuevoCamino = [...camino, arista]
		const nuevosCaminos = obtenerCaminos(aristas, siguiente, nuevoCamino);

		acc.push(...nuevosCaminos);
	}

	return acc;
}
const edges = [{ from: 'b', to: 'a' }, { from: 'c', to: 'b' }, { from: 'c', to: 'a' }, { from: 'c', to: 'd' }]

const faces = edges.flatMap(edge => obtenerCaminos(edges, edge, []).filter((camino) =>
	haceBucle(camino)
))


console.dir({ faces }, { depth: null })