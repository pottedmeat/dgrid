import { WidgetConstructor, WidgetProperties } from '@dojo/widget-core/interfaces';
import { spy } from 'sinon';

export function spyOnWidget<C extends WidgetConstructor>(constructor: C, addSpies: (prototype: any) => void) {
	const constructorSpy = spy(function(this: C) {
		constructor.apply(this, arguments);
	});
	constructorSpy.prototype = Object.create(constructor.prototype);
	addSpies.call({}, constructorSpy.prototype);
	(<any> constructorSpy)['_type'] = (<any> constructor)['_type'];
	return constructorSpy;
}

export function cleanProperties<P extends WidgetProperties>(properties: Partial<P>): Partial<P> {
	delete properties.bind;
	delete (<any> properties).registry;
	return properties;
}
