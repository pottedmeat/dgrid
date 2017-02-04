import * as registerSuite from 'intern/lib/interfaces/object';
import { assert } from 'chai';
import { VNode } from '@dojo/interfaces/vdom';
import createCell from '../../src/createCell';
import { ItemProperties } from '../../src/createGrid';

registerSuite({
	name: 'createCell',
	render: {
		'data property used as cell text node'() {
			const cell = createCell({ properties: <any> { data: 'Hello, World!' } });

			const vnode = <VNode> cell.__render__();
			assert.strictEqual(vnode.vnodeSelector, 'td.dgrid-cell');
			assert.strictEqual(vnode.text, 'Hello, World!');
		},
		'data propety value passed through renderer when provided'() {
			const renderer = (item: ItemProperties<string>, value: any) => {
				return value.replace('World', 'Dojo');
			};
			const cell = createCell({ properties: <any> { data: 'Hello, World!', renderer } });

			const vnode = <VNode> cell.__render__();
			assert.strictEqual(vnode.vnodeSelector, 'td.dgrid-cell');
			assert.strictEqual(vnode.text, 'Hello, Dojo!');
		},
		'null is returned when no data property'() {
			const cell = createCell({});

			const vnode = <VNode> cell.__render__();
			assert.strictEqual(vnode.vnodeSelector, 'td.dgrid-cell');
			assert.isUndefined(vnode.text);
		},
		'cell data is stringified'() {
			const cell = createCell({ properties: <any> { data: <any> 1234 } });

			const vnode = <VNode> cell.__render__();
			assert.strictEqual(vnode.vnodeSelector, 'td.dgrid-cell');
			assert.strictEqual(vnode.text, '1234');
		}
	}
});
