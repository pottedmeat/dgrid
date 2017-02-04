import * as registerSuite from 'intern/lib/interfaces/object';
import { assert } from 'chai';
import { VNode } from '@dojo/interfaces/vdom';
import FactoryRegistry from '@dojo/widget-core/FactoryRegistry';
import { spy, stub, SinonSpy, SinonStub } from 'sinon';
import * as compose from '@dojo/compose/compose';
import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import createBody from '../../src/createBody';
import { DgridBodyProperties } from '../../src/createBody';

let widgetBaseSpy: SinonSpy;
let getStub: SinonStub;
let isComposeFactoryStub: SinonStub;
let mockRegistry: FactoryRegistry;

registerSuite({
	name: 'createBody',
	beforeEach() {
		widgetBaseSpy = spy(createWidgetBase);
		getStub = stub().withArgs('row').returns(widgetBaseSpy);
		isComposeFactoryStub = stub(compose, 'isComposeFactory').returns(true);
		mockRegistry = <any> {
			get: getStub,
			has() {
				return true;
			}
		};
	},
	afterEach() {
		isComposeFactoryStub.restore();
	},
	'render with items'() {
		const items = [
			{
				id: 'id',
				data: { id: 'id', foo: 'bar' }
			}
		];
		const properties: DgridBodyProperties = {
			registry: mockRegistry,
			items,
			columns: [
				{ id: 'foo', label: 'foo' }
			]
		};

		const body = createBody({ properties });
		const promise = new Promise((resolve) => setTimeout(resolve, 10));

		return promise.then(() => {
			const vnode = <VNode> body.__render__();

			assert.strictEqual(vnode.vnodeSelector, 'div.dgrid-scroller');
			assert.lengthOf(vnode.children, 1);
			assert.equal(vnode.children![0].vnodeSelector, 'div.dgrid-content');
			assert.lengthOf(vnode.children![0].children, 1);
			assert.isTrue(widgetBaseSpy.calledOnce);
			assert.isTrue(widgetBaseSpy.calledWith({
				properties: {
					key: 'id',
					registry: mockRegistry,
					columns: properties.columns,
					item: properties.items[0],
					bind: body
				}
			}));
		});
	},
	'render with no items'() {
		const items: any[] = [];
		const properties = {
			registry: mockRegistry,
			items,
			columns: [
				{ id: 'foo', label: 'foo' }
			]
		};

		const row = createBody({ properties });
		const promise = new Promise((resolve) => setTimeout(resolve, 10));

		return promise.then(() => {
			const vnode = <VNode> row.__render__();

			assert.strictEqual(vnode.vnodeSelector, 'div.dgrid-scroller');
			assert.lengthOf(vnode.children, 1);
			assert.equal(vnode.children![0].vnodeSelector, 'div.dgrid-content');
			assert.lengthOf(vnode.children![0].children, 0);
			assert.isTrue(widgetBaseSpy.notCalled);
		});
	}
});
