import API from "../api.js";
import { EvocationsVariantFlags } from "../automatedEvocationsVariantModels.js";
import CONSTANTS from "../constants.js";

// =============================
// Module Generic function
// =============================

// return true or false if you, the user, should run the scripts on this actor.
export function should_I_run_this(actor) {
	let user;
	//@ts-ignore
	const { OWNER } = CONST.DOCUMENT_OWNERSHIP_LEVELS;

	// find a non-GM who is active and owner of the actor.
	user = game.users?.find((i) => {
		const a = !i.isGM;
		const b = i.active;
		const c = actor.testUserPermission(i, OWNER);
		return a && b && c;
	});
	if (user) {
		return user === game.user;
	}
	// find a GM who is active and owner of the actor.
	user = game.users?.find((i) => {
		const a = i.isGM;
		const b = i.active;
		return a && b;
	});
	return user === game.user;
}

export function is_real_number(inNumber) {
	return !isNaN(inNumber) && typeof inNumber === "number" && isFinite(inNumber);
}

export function isGMConnected() {
	return Array.from(game.users).find((user) => user.isGM && user.active) ? true : false;
}
export function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
// export let debugEnabled = 0;
// 0 = none, warnings = 1, debug = 2, all = 3
export function debug(msg, args = "") {
	if (game.settings.get(CONSTANTS.MODULE_NAME, "debug")) {
		console.log(`DEBUG | ${CONSTANTS.MODULE_NAME} | ${msg}`, args);
	}
	return msg;
}
export function log(message) {
	message = `${CONSTANTS.MODULE_NAME} | ${message}`;
	console.log(message.replace("<br>", "\n"));
	return message;
}
export function notify(message) {
	message = `${CONSTANTS.MODULE_NAME} | ${message}`;
	ui.notifications?.notify(message);
	console.log(message.replace("<br>", "\n"));
	return message;
}
export function info(info, notify = false) {
	info = `${CONSTANTS.MODULE_NAME} | ${info}`;
	if (notify) ui.notifications?.info(info);
	console.log(info.replace("<br>", "\n"));
	return info;
}
export function warn(warning, notify = false) {
	warning = `${CONSTANTS.MODULE_NAME} | ${warning}`;
	if (notify) ui.notifications?.warn(warning);
	console.warn(warning.replace("<br>", "\n"));
	return warning;
}
export function error(error, notify = true) {
	error = `${CONSTANTS.MODULE_NAME} | ${error}`;
	if (notify) ui.notifications?.error(error);
	return new Error(error.replace("<br>", "\n"));
}
export function timelog(message) {
	warn(Date.now(), message);
}
export const i18n = (key) => {
	return game.i18n.localize(key)?.trim();
};
export const i18nFormat = (key, data = {}) => {
	return game.i18n.format(key, data)?.trim();
};
// export const setDebugLevel = (debugText: string): void => {
//   debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
//   // 0 = none, warnings = 1, debug = 2, all = 3
//   if (debugEnabled >= 3) CONFIG.debug.hooks = true;
// };
export function dialogWarning(message, icon = "fas fa-exclamation-triangle") {
	return `<p class="${CONSTANTS.MODULE_NAME}-dialog">
          <i style="font-size:3rem;" class="${icon}"></i><br><br>
          <strong style="font-size:1.2rem;">${CONSTANTS.MODULE_NAME}</strong>
          <br><br>${message}
      </p>`;
}
export function cleanUpString(stringToCleanUp) {
	// regex expression to match all non-alphanumeric characters in string
	const regex = /[^A-Za-z0-9]/g;
	if (stringToCleanUp) {
		return i18n(stringToCleanUp).replace(regex, "").toLowerCase();
	} else {
		return stringToCleanUp;
	}
}
export function isStringEquals(stringToCheck1, stringToCheck2, startsWith = false) {
	if (stringToCheck1 && stringToCheck2) {
		if (startsWith) {
			return cleanUpString(stringToCheck1).startsWith(cleanUpString(stringToCheck2));
		} else {
			return cleanUpString(stringToCheck1) === cleanUpString(stringToCheck2);
		}
	} else {
		return stringToCheck1 === stringToCheck2;
	}
}
// =========================================================================================
/**
 * Called when a token is right clicked on to display the HUD.
 * Adds a button with a icon, and adds a slash on top of it if it is already active.
 * @param {Object} app - the application data
 * @param {Object} html - the html data
 * @param {Object} hudToken - The HUD Data
 */
export async function renderAutomatedEvocationsVariantHud(app, html, hudToken) {
	// if only one token is selected
	// if (canvas.tokens?.controlled.length == 1) {
	const sourceToken = canvas.tokens?.placeables.find((t) => {
		return t.id === hudToken._id;
	});
	if (!sourceToken || !sourceToken.isOwner) {
		return;
	}
	const actor = retrieveActorFromToken(sourceToken);
	if (!actor) {
		// warn(`No actor founded on canvas with token '${sourceToken.id}'`, true);
		return;
	}

	const listEvocationsVariants =
		// (actor.getFlag(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.IS_LOCAL) ||
		// game.settings.get(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.STORE_ON_ACTOR)
		//   ? actor.getFlag(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.COMPANIONS)
		//   : game.user?.getFlag(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.COMPANIONS)) || [];
		actor.getFlag(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.COMPANIONS) || [];
	if (listEvocationsVariants.length > 0) {
		//addToRevertEvocationsVariantButton(html, sourceToken);
		addToEvocationsVariantButton(html, sourceToken);
		// } else {
		//   // Do not show anything
		// }
	}
}
function addToEvocationsVariantButton(html, sourceToken) {
	if (!sourceToken || !sourceToken.isOwner) {
		return;
	}

	const button = buildButton(html, `Make summon with ${sourceToken.name}`);

	const actor = retrieveActorFromToken(sourceToken);
	if (!actor) {
		// warn(`No actor founded on canvas with token '${sourceToken.id}'`, true);
		return;
	}
	const random = actor?.getFlag(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.RANDOM) ?? false;
	const ordered = actor?.getFlag(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.ORDERED) ?? false;
	// const storeonactor = actor?.getFlag(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.STORE_ON_ACTOR) ?? false;
	button.find("i").on("click", async (ev) => {
		for (const targetToken of canvas.tokens?.controlled) {
			const targetActor = retrieveActorFromToken(targetToken);
			if (targetActor) {
				if (targetToken) {
					API._invokeEvocationsVariantManagerInner(targetToken, targetActor, false, ordered, random);
				} else {
					warn(`No token is founded checkout the logs`, true);
				}
			} else {
				warn(`No actor is founded checkout the logs`, true);
			}
		}
	});
	button.find("i").on("contextmenu", async (ev) => {
		for (const targetToken of canvas.tokens?.controlled) {
			// Do somethign with right click
			const targetActor = retrieveActorFromToken(targetToken);
			if (targetActor) {
				API._invokeEvocationsVariantManagerInner(targetToken, targetActor, true, ordered, random);
			}
		}
	});
}

function buildButton(html, tooltip) {
	const iconClass = "fas fa-cat"; // TODO customize icon ???
	const button = $(
		`<div class="control-icon ${CONSTANTS.MODULE_NAME}" title="${tooltip}"><i class="${iconClass}"></i></div>`
	);
	const settingHudColClass = game.settings.get(CONSTANTS.MODULE_NAME, "hudColumn") ?? ".left";
	const settingHudTopBottomClass = game.settings.get(CONSTANTS.MODULE_NAME, "hudTopBottom") ?? "top";
	const buttonPos = "." + settingHudColClass.toLowerCase();
	const col = html.find(buttonPos);
	if (settingHudTopBottomClass === "top") {
		col.prepend(button);
	} else {
		col.append(button);
	}
	return button;
}
// /**
//  * Adds the hud button to the HUD HTML
//  * @param {object} html - The HTML
//  * @param {object} data - The data
//  * @param {boolean} hasSlash - If true, the slash will be placed over the icon
//  */
// async function addButton(html, data, hasSlash = false) {
//   const button = $(`<div class="control-icon ${CONSTANTS.MODULE_NAME}"><i class="fas ${SettingsForm.getIconClass()}"></i></div>`);
//   if (hasSlash) {
//     this.addSlash(button);
//   }
//   const col = html.find(SettingsForm.getHudColumnClass());
//   if (SettingsForm.getHudTopBottomClass() == 'top') {
//     col.prepend(button);
//   } else {
//     col.append(button);
//   }
//   button.find('i').on('click', async (ev) => {
//     // do something
//     if (hasSlash) {
//       removeSlash(button);
//     } else {
//       addSlash(button);
//     }
//   });
// }
/**
 * Adds a slash icon on top of the icon to signify is active
 * @param {Object} button - The HUD button to add a slash on top of
 */
function addSlash(button) {
	const slash = $(`<i class="fas fa-slash" style="position: absolute; color: tomato"></i>`);
	button.addClass("fa-stack");
	button.find("i").addClass("fa-stack-1x");
	slash.addClass("fa-stack-1x");
	button.append(slash);
	return button;
}
/**
 * Removes the slash icon from the button to signify that it is no longer active
 * @param {Object} button - The button
 */
function removeSlash(button) {
	const slash = button.find("i")[1];
	slash.remove();
}
export function retrieveActorFromToken(sourceToken) {
	if (!sourceToken.actor) {
		return undefined;
	}
	// const storeOnActorFlag = <boolean>sourceToken.actor.getFlag(CONSTANTS.MODULE_NAME, EvocationsVariantFlags.STORE_ON_ACTOR);
	// if (!storeOnActorFlag) {
	//   return sourceToken.actor;
	// }
	let actor = undefined;
	//@ts-ignore
	if (sourceToken.document.actorLink) {
		//@ts-ignore
		actor = game.actors?.get(sourceToken.document.actorId);
	}
	// DO NOT NEED THIS
	// if(!actor){
	//   actor = <Actor>game.actors?.get(sourceToken.actor?.id);
	// }
	if (!actor) {
		actor = sourceToken.actor;
	}
	return actor;
}
export async function retrieveActorFromData(aId, aName, currentCompendium, createOnWorld = false) {
	let actorToTransformLi = null;
	if (!aId && !aName) {
		return null;
	}
	actorToTransformLi = game.actors?.contents.find((a) => {
		return a.id === aId || a.name === aName;
	});
	if (
		!actorToTransformLi &&
		currentCompendium &&
		currentCompendium != "none" &&
		currentCompendium != "nonenodelete"
	) {
		const pack = game.packs.get(currentCompendium);
		if (pack) {
			await pack.getIndex();
			// If the actor is found in the index, return it by exact ID
			if (pack.index.get(aId)) {
				actorToTransformLi = await pack.getDocument(aId);
			}
			// If not found, search for the actor by name
			if (!actorToTransformLi) {
				for (const entityComp of pack.index) {
					const actorComp = await pack.getDocument(entityComp._id);
					if (actorComp.id === aId || actorComp.name === aName) {
						actorToTransformLi = actorComp;
						break;
					}
				}
			}
		}
		if (actorToTransformLi && createOnWorld && (game.user?.isGM || should_I_run_this(actorToTransformLi))) {
			// Create actor from compendium
			const collection = game.collections.get(pack.documentName);
			const id = actorToTransformLi.id; // li.data("document-id");
			actorToTransformLi = await collection.importFromCompendium(pack, id, {}, { renderSheet: false });
		}
	}
	if (!actorToTransformLi) {
		actorToTransformLi = game.actors?.contents.find((a) => {
			return a.id === aId || a.name === aName;
		});
	}
	return actorToTransformLi;
}

export async function rollFromString(rollString, actor) {
	let myvalue = 0;
	if (!rollString) {
		// Ignore ???
		if (rollString === "0") {
			myvalue = 0;
		} else {
			myvalue = 1;
		}
	} else {
		if (
			String(rollString).toLowerCase().includes("data.") ||
			String(rollString).toLowerCase().includes("system.")
		) {
			const formula = rollString.replace(/data\./g, "@").replace(/system\./g, "@");
			const data = actor ? actor.getRollData() : {};
			const roll = new Roll(formula, data);
			// Roll the dice.
			let myresult = 0;
			//roll.roll();
			try {
				// TODO Roll#evaluate is becoming asynchronous. In the short term you may pass async=true or async=false
				// to evaluation options to nominate your preferred behavior.
				roll.evaluate({ async: false });
				//await roll.evaluate({async: true});
				myresult = roll.total ? roll.total : parseInt(roll.result);
			} catch (e) {
				myresult = parseInt(eval(roll.result));
			}
			if (!is_real_number(myresult)) {
				warn(`The formula '${formula}' doesn't return a number we set the default 1`);
				myvalue = 1;
			} else {
				myvalue = myresult;
			}
		} else if (!is_real_number(rollString)) {
			const formula = rollString;
			const data = actor ? actor.getRollData() : {};
			const roll = new Roll(formula, data);
			// Roll the dice.
			let myresult = 0;
			//roll.roll();
			try {
				// TODO Roll#evaluate is becoming asynchronous. In the short term you may pass async=true or async=false
				// to evaluation options to nominate your preferred behavior.
				roll.evaluate({ async: false });
				//await roll.evaluate({async: true});
				myresult = roll.total ? roll.total : parseInt(roll.result);
			} catch (e) {
				myresult = parseInt(eval(roll.result));
			}
			if (!is_real_number(myresult)) {
				warn(`The formula '${formula}' doesn't return a number we set the default 1`);
				myvalue = 1;
			} else {
				myvalue = myresult;
			}
		} else if (is_real_number(rollString)) {
			myvalue = Number(rollString);
		} else {
			myvalue = 0;
		}
	}
	return myvalue;
}

export async function transferPermissionsActorInner(sourceActor, targetActor, externalUserId) {
	// if (!game.user.isGM) throw new Error("You do not have the ability to configure permissions.");

	// let sourceActor = //actor to copy the permissions from
	// let targetActor = //actor to copy the permissions to

	// The important part is the {diff:false, recursive: false},
	// which ensures that any undefined parts of the permissions object
	// are not filled in by the existing permissions on the target actor
	// const user = game.users.get(userId);
	// if (externalUserId) {
	// 	// Set ownership
	// 	const ownershipLevels = {};
	// 	ownershipLevels[externalUserId] = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
	// 	// Update a single Document
	// 	await targetActor.update({ ownership: ownershipLevels }, { diff: false, recursive: false, noHook: true });
	// }

	// For a straight duplicate of permissions, you should be able to just do:
	// return await targetActor.update({ permission: _getHandPermission(sourceActor) }, { diff: false, recursive: false, noHook: true });
	return await targetActor.update(
		{ ownership: _getHandPermission(sourceActor, externalUserId) },
		{ diff: false, recursive: false, noHook: true }
	);
}

//this method is on the actor, so "this" is the actor document
function _getHandPermission(actor, externalUserId) {
	const handPermission = duplicate(actor.ownership); // actor.permission
	for (const key of Object.keys(handPermission)) {
		//remove any permissions that are not owner
		if (handPermission[key] < CONST.DOCUMENT_PERMISSION_LEVELS.OWNER) {
			delete handPermission[key];
		}
		//set default permission to none/limited/observer
		handPermission.default = CONST.DOCUMENT_PERMISSION_LEVELS.NONE; // CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER
	}
	if (!handPermission[externalUserId] || handPermission[externalUserId] < CONST.DOCUMENT_PERMISSION_LEVELS.OWNER) {
		handPermission[externalUserId] = CONST.DOCUMENT_PERMISSION_LEVELS.OWNER;
	}
	return handPermission;
}
