(<any> require).config({
	baseUrl: '../../../',
	packages: [
		{ name: 'src', location: '_build/src' },
		{ name: '@dojo', location: 'node_modules/@dojo' },
		{ name: 'pepjs', location: 'node_modules/pepjs/dist', main: 'pep' },
		{ name: 'maquette', location: 'node_modules/maquette/dist', main: 'maquette' },
		{ name: 'intersection-observer', location: 'node_modules/intersection-observer', main: 'intersection-observer' }
	]
});

(<any> require)([ 'src/examples/main' ], function () {});
