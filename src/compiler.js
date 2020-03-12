const fs = require("fs");
const JFile = require('jfile');

const {replaceAll, allIndexesOf, replaceAt, parse} = require("./util.js");

var directory = process.argv[2];

let project = fs.readdirSync(directory);

let config;

project.forEach((f) => {

	let fi = f.split(".");

	if (fi[fi.length - 1] == "bsp") {

		config = new JFile(`${directory}/${f}`);

		return;

	}

});

let projectName = "";
let entryFile = "";
let projectFiles = [];

for(let i = 1; i < config.lines.length + 1; i++) {

	let line = new String(config.lines[i - 1]); 

	let par = line.split(" ");

	switch (par[0]) {

		case "#":

			projectName = par[1];

		break;

		case "!":

			entryFile = par[1];

		case "?":

			projectFiles.push(par[1]);

		break;

		default:

			continue;

	}

}

fs.mkdirSync(`./src/com/${projectName}`, 0744);

for (let f = 0; f < projectFiles.length; f++) {

	let file = new JFile(`${directory}/${projectFiles[f]}`);
	let newFile = [];

	newFile.unshift("const log = console.log;");

	let scopeLevel = 0;

	let switchLevel = [-1];
	let protectLevel = [-1];
	let scopesLevel = [-1];
	let regionLevel = [-1];

	let scopes = 0;
	let scopeNames = [-1];

	let regions = 0;
	let regionNames = [-1];

	let vars = {};

	for(i = 1; i < file.lines.length + 1; i++) {
		let line = new String(file.lines[i - 1]);
		let newLine = "";
		let symbols = line.split(" ");

		let line2;
		let symbols2;

		symbols[0] = replaceAll(symbols[0], "\t", "");

		switch (symbols[0]) {
			case "func":
				scopeLevel++;
				newLine = `function ${symbols[1]}`;
				if (symbols[2] == "->") {
					newLine += " () {";

				} else if (symbols[2] == "<-") {
					let ret = symbols.splice(3, symbols.length - 3);
					newLine += ` () { return ${ret.join(" ")} }`;
				} else {
					let i = 2;
					while (symbols[i] != "->" && symbols[i] != "<-") {
						if (i > 2000) break; 
						if (symbols[i] == "|") {
							newLine += ",";
							i++;
							continue;
						}
						newLine += ` ${symbols[i]}`;
						i++;
					}
					if (symbols[i] == "->") {
						newLine += " {";
					} else if (symbols[i] == "<-") {
						let ret = symbols.splice(i + 1, symbols.length - (i + 1));
						newLine += ` { return ${ret.join(" ")} }`;
					}
				}
			break;

			case "static":
				scopeLevel++;
				newLine = `static ${symbols[1]}`;
				if (symbols[2] == "->") {
					newLine += " () {";
				} else {
					let i = 2;
					while (symbols[i] != "->" && symbols[i] != "<-") {
						if (i > 2000) break; 
						if (symbols[i] == "|") {
							newLine += ",";
							i++;
							continue;
						}
						newLine += ` ${symbols[i]}`;
						i++;
					}
					if (symbols[i] == "->") {
						newLine += " {";
					} else if (symbols[i] == "<-") {
						let ret = symbols.splice(i + 1, symbols.length - (i + 1));
						newLine += ` { return ${ret.join(" ")} }`;
					}
				}
			break;

			case "method":
				scopeLevel++;
				newLine = `${symbols[1]}`;
				if (symbols[2] == "->") {
					newLine += " () {";
				} else {
					let i = 2;
					while (symbols[i] != "->" && symbols[i] != "<-") {
						if (i > 2000) break; 
						if (symbols[i] == "|") {
							newLine += ",";
							i++;
							continue;
						}
						newLine += ` ${symbols[i]}`;
						i++;
					}
					if (symbols[i] == "->") {
						newLine += " {";
					} else if (symbols[i] == "<-") {
						let ret = symbols.splice(i + 1, symbols.length - (i + 1));
						newLine += ` { return ${ret.join(" ")} }`;
					}
				}
			break;

			case "out":
				let ret = symbols.splice(1, symbols.length - 1);
				newLine = `return ${ret.join(" ")}`;
			break;

			case "var":

				let dec = symbols.splice(3, symbols.length - 3);
				newLine = `let ${symbols[1]} : ${dec.join(" ")}`;
				vars[symbols[1]] = true;

			break;

			case "varh":
				let dec2 = symbols.splice(3, symbols.length - 3);
				newLine = `var ${symbols[1]} : ${dec2.join(" ")}`;
				vars[symbols[1]] = true;
			break;

			case "constant":
				let dec3 = symbols.splice(3, symbols.length - 3);
				newLine = `const ${symbols[1]} : ${dec3.join(" ")}`;
				vars[symbols[1]] = true;
			break;

			case "<-":
				scopeLevel--;

				newLine = "}";

				if (scopeLevel == switchLevel[switchLevel.length - 1]) {
					newLine = "break";
				} else if (scopeLevel < switchLevel[switchLevel.length - 1]) {
					switchLevel.pop();
				}

				if (scopeLevel < protectLevel[protectLevel.length - 1]) {
					protectLevel.pop();
					newLine = "} catch (e) {}";
				}

				if (scopeLevel < scopesLevel[scopesLevel.length - 1]) {
					scopesLevel.pop();
					newLine = `}; scope${scopeNames[scopeNames.length - 1]}()`;
					scopeNames.pop();
				}

				if (scopeLevel < regionLevel[regionLevel.length - 1]) {
					regionLevel.pop();
					regionNames.pop();
					continue;
				}
			break;

			case "<->":
				newLine = "}";

				switch (symbols[1]) {
					case "else":
						newLine += "else {";
					break;
					case "elif":
						let con = symbols.splice(2, symbols.length - 2);
						newLine += `else if ${con.join(" ")}`;
					break;
					case "catch":
						newLine += " catch (e) {";
					break;
					case "while":
							
						let w = symbols.splice(1, symbols.length - 1);

						newLine += ` ${w.join(" ")}`;

					break;
				}
			break;

			case "package":
				newLine = `module.exports : ${symbols[1]}`;
			break;

			case "switch":
				scopeLevel++;
				switchLevel.push(scopeLevel);
				newLine = symbols.join(" ");
			break;

			case "scope":
				scopes++;
				scopeLevel++;
				scopesLevel.push(scopeLevel);
				scopeNames.push(scopes);
				newLine = `const scope${scopes} : function() {`;
			break;

			case "region":
				regions++;
				scopeLevel++;
				regionLevel.push(scopeLevel);
				regionNames.push(regions);
				continue;
			break;

			case "case":
				scopeLevel++;
				newLine = `case ${symbols[1]}:`;
			break;

			case "any":
				scopeLevel++;
				newLine = "default:";
			break;

			case "protect":
				scopeLevel++;
				protectLevel.push(scopeLevel);
				newLine = "try {";
			break;

			case "enum":

				newLine = `const ${symbols[1]} : {}; `;

				let props = 0;

				do {
					i++;

					line2 = file.lines[i - 1]; 
					line2 = replaceAll(line2, "\t", "");
					symbols2 = line2.split(" ");

					if (symbols2[0] == "<-") {
						break;
					}

					newLine += `Object.defineProperty(${symbols[1]}, "${replaceAll(symbols2[0], ",", "")}", {value: ${props}, writable: false, enumerable: true, configurable: true});`;

					props++;

				} while(symbols2[0] != "<-");

			break;

			case "list":

				newLine = `let ${symbols[1]} : []; `;

				do {
					i++;

					line2 = file.lines[i - 1]; 
					line2 = replaceAll(line2, "\t", "");
					symbols2 = line2.split(" ");

					if (symbols2[0] == "<-") {
						break;
					}

					newLine += `${symbols[1]}.push(${replaceAll(symbols2[0], ",", "")});`;

				} while(symbols2[0] != "<-");

			break;

			case "struct":

				newLine = `let ${symbols[1]} : {}; `;

				do {
					i++;

					line2 = file.lines[i - 1]; 
					line2 = replaceAll(line2, "\t", "");
					symbols2 = line2.split(" ");

					if (symbols2[0] == "<-") {
						break;
					}

					newLine += `Object.defineProperty(${symbols[1]}, "${symbols2[0]}", {value: ${replaceAll(symbols2[2], ",", "")}, writable: true, enumerable: true, configurable: true});`;

				} while(symbols2[0] != "<-");

			break;

			case "for":

				let t = line.split(" ");

				if (t[4] == "to") {

					let range = 0;
					let increment = 1;

					range = replaceAll(t[5], ")", "");

					if (t.length > 6) {
						if (t[6] == "by") {
							increment = replaceAll(t[7], ")", "");
						}
					}

					let st = t[1].split("(").join("");

					let start = parseInt(t[3].split("(").join(""));

					let dir = start < range;

					if (dir) newLine = `for (let ${st} : 0; ${st} < ${range}; ${st} += ${increment}){`;
					else newLine = `for (let ${st} : 0; ${st} > ${range}; ${st} += ${increment}){`;
				} else {

					newLine = parse(line, " | ", "; ");

					let s = newLine.split("(");
					newLine = s.join("(let ");

				}

				scopeLevel++;

			break;

			case "try":
			case "if":
			case "class":
			case "constructor":
			case "while":
				scopeLevel++;

			default:
				
				if (vars[symbols[0]]) {
					if (symbols[1] == "+") symbols[1] = "+=";
					if (symbols[1] == "-") symbols[1] = "-=";''
					if (symbols[1] == "*") symbols[1] = "*=";
					if (symbols[1] == "/") symbols[1] = "/=";
					if (symbols[1] == "%") symbols[1] = "%=";
					if (symbols[1] == "^") symbols[1] = "**=";
				}

				newLine = symbols.join(" ");
		}

		newLine = parse(newLine, "->", "{");
		newLine = parse(newLine, "origin.", "this.");
		newLine = parse(newLine, " = ", " == ");
		newLine = parse(newLine, " | ", ", ");
		newLine = parse(newLine, "parent", "super");
		newLine = parse(newLine, "<<", "extends");
		newLine = parse(newLine, "^", "**");
		newLine = parse(newLine, " and ", " && ");
		newLine = parse(newLine, " or ", " || ");
		newLine = parse(newLine, " : ", " = ");
		newLine = parse(newLine, "import(", "require(");

		if (line == '') {
			continue;
		} else {
			newFile.push("\n" + newLine);
		}
	}

	fs.writeFileSync(`./src/com/${projectName}/${projectFiles[f].split(".")[0]}.js`, newFile.join(""));

}

const Program = require(`./com/${projectName}/${entryFile.split(".")[0]}.js`);
Program.main();
