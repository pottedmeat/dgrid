import * as registerSuite from 'intern/lib/interfaces/object';
import { assert } from 'chai';
import { VNode } from '@dojo/interfaces/vdom';
import FactoryRegistry from '@dojo/widget-core/FactoryRegistry';
import { spy, SinonSpy } from 'sinon';
import Grid from '../../src/Grid';
import ArrayDataProvider from '../../src/providers/ArrayDataProvider';
import { GridProperties } from '../../src/Grid';
import Header from '../../src/Header';
import Body from '../../src/Body';
import { spyOnWidget, cleanProperties } from './util';
import { BodyProperties } from '../../src/Body';
import { HeaderProperties } from '../../src/Header';

let headerSpy: SinonSpy;
let bodySpy: SinonSpy;
let setHeaderProperties: SinonSpy | null = null;
let setBodyProperties: SinonSpy | null = null;
let mockRegistry: FactoryRegistry;

registerSuite({
	name: 'Grid',
	beforeEach() {
		setHeaderProperties = null;
		headerSpy = spyOnWidget(Header, (prototype) => {
			prototype.header = true;
			setHeaderProperties = spy(prototype, 'setProperties');
		});

		setBodyProperties = null;
		bodySpy = spyOnWidget(Body, (prototype) => {
			prototype.body = true;
			setBodyProperties = spy(prototype, 'setProperties');
		});

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
	'dgrid'() {
		const properties: GridProperties = {
			registry: mockRegistry,
			dataProvider: new ArrayDataProvider({
				data: []
			}),
			columns: [
				{ id: 'foo', label: 'foo' }
			]
		};

		const dgrid = new Grid();
		dgrid.setProperties(properties);
		const vnode = <VNode> dgrid.__render__();

		assert.strictEqual(vnode.vnodeSelector, 'div');
		assert.strictEqual(vnode.properties!['role'], 'grid');

		assert.isTrue(headerSpy.calledOnce, 'HeaderSpy called once');
		assert.isTrue(headerSpy.calledWithNew(), 'HeaderSpy called with new');
		assert.isNotNull(setHeaderProperties);
		assert.isTrue(setHeaderProperties!.calledOnce, 'setHeaderProperties called once');
		const headerProperties = cleanProperties<HeaderProperties>(setHeaderProperties!.getCall(0).args[0]);
		assert.isDefined(headerProperties.onSortRequest);
		delete headerProperties.onSortRequest;
		assert.deepEqual(headerProperties, {
			columns: properties.columns,
			sortDetails: [],
			theme: undefined
		});

		assert.isTrue(bodySpy.calledOnce, 'BodySpy called once');
		assert.isTrue(bodySpy.calledWithNew(), 'BodySpy called with new');
		assert.isNotNull(setBodyProperties);
		assert.isTrue(setBodyProperties!.calledOnce, 'setBodyProperties called once');
		const bodyProperties = cleanProperties<BodyProperties>(setBodyProperties!.getCall(0).args[0]);
		assert.deepEqual(bodyProperties, {
			columns: properties.columns,
			items: [],
			theme: undefined
		});
	},
	'sort'() {
		const properties: GridProperties = {
			registry: mockRegistry,
			dataProvider: new ArrayDataProvider({
				data: []
			}),
			columns: [
				{ id: 'foo', label: 'foo' }
			]
		};

		const dgrid = new Grid();
		dgrid.setProperties(properties);
		spy(dgrid, 'invalidate');

		let vnode = <VNode> dgrid.__render__();

		assert.strictEqual(vnode.vnodeSelector, 'div');
		assert.strictEqual(vnode.properties!['role'], 'grid');

		assert.isTrue(headerSpy.calledOnce, 'HeaderSpy called once');
		assert.isTrue(headerSpy.calledWithNew(), 'HeaderSpy called with new');
		assert.isNotNull(setHeaderProperties);
		let headerProperties = cleanProperties<HeaderProperties>(setHeaderProperties!.getCall(0).args[0]);
		assert.isDefined(headerProperties.onSortRequest);
		delete headerProperties.onSortRequest;
		assert.deepEqual(headerProperties, {
			columns: properties.columns,
			sortDetails: [],
			theme: undefined
		});

		assert.isTrue(bodySpy.calledOnce);

		properties.dataProvider.sort({
			columnId: 'foo',
			descending: true
		});
		vnode = <VNode> dgrid.__render__();

		assert.isTrue((<SinonSpy> dgrid.invalidate).called);
		assert.isNotNull(setHeaderProperties);
		assert.isTrue(setHeaderProperties!.calledTwice, 'setHeaderProperties called twice');
		headerProperties = cleanProperties<HeaderProperties>(setHeaderProperties!.getCall(1).args[0]);
		assert.isDefined(headerProperties.onSortRequest);
		delete headerProperties.onSortRequest;
		assert.deepEqual(headerProperties, {
			columns: properties.columns,
			sortDetails: [ { columnId: 'foo', descending: true } ],
			theme: undefined
		});

		assert.isTrue(bodySpy.calledOnce);
	},
	'reassign dataProvider'() {
		let properties: GridProperties = {
			registry: mockRegistry,
			dataProvider: new ArrayDataProvider({
				data: []
			}),
			columns: [
				{ id: 'foo', label: 'foo' }
			]
		};

		const dgrid = new Grid();
		dgrid.setProperties(properties);
		let vnode = <VNode> dgrid.__render__();

		spy(dgrid, 'invalidate');

		properties = {
			...properties,
			dataProvider: new ArrayDataProvider({
				data: []
			})
		};
		dgrid.setProperties(properties);
		vnode = <VNode> dgrid.__render__();

		assert.isTrue((<SinonSpy> dgrid.invalidate).called, 'invalidate called');
		assert.isTrue(setHeaderProperties!.calledTwice, 'setHeaderProperties called twice');
	}
});
