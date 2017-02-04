import * as registerSuite from 'intern/lib/interfaces/object';
import { assert } from 'chai';
import { VNode } from '@dojo/interfaces/vdom';
import { assign } from '@dojo/core/lang';
import FactoryRegistry from '@dojo/widget-core/FactoryRegistry';
import { spy, stub, SinonSpy, SinonStub } from 'sinon';
import * as compose from '@dojo/compose/compose';
import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import createGrid from '../../src/createGrid';
import createArrayDataProvider from '../../src/createArrayDataProvider';

let headerSpy: SinonSpy;
let bodySpy: SinonSpy;
let isComposeFactoryStub: SinonStub;
let mockRegistry: FactoryRegistry;

registerSuite({
	name: 'createGrid',
	beforeEach() {
		headerSpy = spy(createWidgetBase.mixin({ mixin: { header: true }}));
		bodySpy = spy(createWidgetBase.mixin({ mixin: { body: true }}));
		isComposeFactoryStub = stub(compose, 'isComposeFactory').returns(true);
		mockRegistry = <any> {
			get(value: string) {
				if (value === 'header') {
					return headerSpy;
				}
				else if (value === 'body') {
					return bodySpy;
				}
			},
			has() {
				return true;
			}
		};
	},
	afterEach() {
		isComposeFactoryStub.restore();
	},
	'dgrid'() {
		const properties = {
			data: createArrayDataProvider({
				data: []
			}),
			columns: [
				{ id: 'foo', label: 'foo' }
			]
		};

		const dgrid = createGrid({ properties: <any> properties });
		dgrid.registry = mockRegistry;
		const vnode = <VNode> dgrid.__render__();

		assert.strictEqual(vnode.vnodeSelector, 'div.dgrid.dgrid-grid');
		assert.strictEqual(vnode.properties!['role'], 'grid');
		assert.isTrue(headerSpy.calledOnce);

		const headerProperties = headerSpy.getCall(0).args[0].properties;
		assert.strictEqual(headerProperties.registry, mockRegistry);
		assert.deepEqual(headerProperties.sortDetails, []);
		assert.deepEqual(headerProperties.columns, properties.columns);

		assert.isTrue(bodySpy.calledOnce);

		// TODO more assert on params
	},
	'onSortRequest'() {
		const properties = {
			data: createArrayDataProvider({
				data: []
			}),
			columns: [
				{ id: 'foo', label: 'foo' }
			]
		};

		const dgrid = createGrid({ properties });
		spy(dgrid, 'invalidate');

		dgrid.registry = mockRegistry;
		let vnode = <VNode> dgrid.__render__();

		assert.strictEqual(vnode.vnodeSelector, 'div.dgrid.dgrid-grid');
		assert.strictEqual(vnode.properties!['role'], 'grid');
		assert.isTrue(headerSpy.calledOnce);

		let headerProperties = headerSpy.getCall(0).args[0].properties;
		assert.strictEqual(headerProperties.registry, mockRegistry);
		assert.deepEqual(headerProperties.sortDetails, []);
		assert.deepEqual(headerProperties.columns, properties.columns);

		assert.isTrue(bodySpy.calledOnce);

		headerSpy = spy(createWidgetBase.mixin({ mixin: { header: true }}));
		bodySpy = spy(createWidgetBase.mixin({ mixin: { body: true }}));

		properties.data.onSortRequest({
			columnId: 'foo',
			descending: true
		});
		vnode = <VNode> dgrid.__render__();

		assert.isTrue((<any> dgrid).invalidate.called);
		assert.isTrue(headerSpy.calledOnce);

		headerProperties = headerSpy.getCall(0).args[0].properties;
		console.log(headerProperties);
		assert.strictEqual(headerProperties.registry, mockRegistry);
		assert.lengthOf(headerProperties.sortDetails, 1);
		assert.deepEqual(headerProperties.sortDetails[0], { columnId: 'foo', descending: true });
		assert.deepEqual(headerProperties.columns, [ { id: 'foo', label: 'foo' } ]);

		assert.isTrue(bodySpy.calledOnce);
	}
});
