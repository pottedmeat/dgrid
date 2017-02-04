export default class Page {
	private remote: any;

	constructor(remote: any) {
		this.remote  = remote;
	}

	delay(): Promise<any> {
		return new Promise((resolve) => setTimeout(resolve, 60));
	}

	init(): Promise<any> {
		return this.remote
			.get('http://localhost:9000/_build/tests/functional/index.html')
			.setFindTimeout(5000)
			.findByCssSelector('.dgrid.dgrid-grid')
			.setFindTimeout(100);
	}

	getCellValue(column: number, row: number): Promise<string> {
		return this.remote
			.findByCssSelector(`tr.dgrid-row:nth-of-type(${row})`)
			.findByCssSelector(`td.dgrid-cell:nth-of-type(${column})`)
			.getVisibleText();
	}

	getFooterStatus() {
		return this.remote
			.findByCssSelector('.dgrid-status')
			.getVisibleText();
	}

	sortColumn(column: number): Promise<any> {
		return this.remote
			.findByCssSelector(`th.dgrid-cell:nth-of-type(${column})`)
			.click()
			.end();
	}

	clickButton(): Promise<any> {
		return this.remote
		.findByCssSelector('button')
		.click()
		.end();
	}
}
