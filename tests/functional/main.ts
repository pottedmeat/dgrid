import * as test from 'intern/lib/interfaces/bdd';
import { assert } from 'chai';
import Page from './page';

test.describe('dgrid', function (this: any) {
	let page: any;

	test.beforeEach(() => {
		page = new Page(this.remote);
		return page.init();
	});

	test.it('Sort by Age Column', function (this: any) {
		return this.remote
			.then(() => page.getCellValue(1, 1))
			.then((value: any) => {
				assert.equal(value, '1 years old');
			})
			.then(() => page.sortColumn(1))
			.then(() => page.getCellValue(1, 1))
			.then((value: any) => {
				assert.equal(value, '20 years old');
			});

	});

	test.it('Sort by Gender Column', function (this: any) {
		return this.remote
			.then(() => page.getCellValue(2, 1))
			.then((value: any) => {
				assert.equal(value, 'is a A');
			})
			.then(() => page.sortColumn(2))
			.then(() => page.getCellValue(2, 1))
			.then((value: any) => {
				assert.equal(value, 'is a Z');
			});
	});
});
