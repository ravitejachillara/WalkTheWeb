/* All code is Copyright 2013-2020 Aaron Scott Dishno Ed.D., HTTP3D Inc. - WalkTheWeb, and the contributors */
/* "3D Browsing" is a USPTO Patented (Serial # 9,940,404) and Worldwide PCT Patented Technology by Aaron Scott Dishno Ed.D. and HTTP3D Inc. */
/* Read the included GNU Ver 3.0 license file for details and additional release information. */

/* These functions provide many of the common functions for browse and admin modes */
/* action zone functions are used to further define what happens when an avatar enters certain action zones */

WTWJS.prototype.checkActionZones = function() {
	/* check to see if your avatar or any other avatar is in an action zone to trigger an action */
	try {
		for (var i = 0; i < WTW.actionZones.length; i++) {
			if (WTW.actionZones[i] != null) {
				var zmoldname = WTW.actionZones[i].moldname;
				var zactionzone = scene.getMeshByID(zmoldname);
				if (zmoldname.indexOf("loadzone") > -1 && WTW.actionZones[i].shown != "2") {
					WTW.actionZones[i].status = 0;
				} else if (zactionzone != null) {
					var zmeinzone = false;
					if (WTW.myAvatar != null) {
						zmeinzone = WTW.myAvatar.intersectsMesh(zactionzone, false);
					}
					var zothersinzone = false;
					/* check if others are in the zone */
					
					zothersinzone = WTW.pluginsCheckActionZoneTrigger(zactionzone);
					if (zmeinzone || zothersinzone) {
						if (zmeinzone && zmoldname.indexOf("loadzone") > -1 && WTW.actionZones[i].status != 2) {
							/* my avatar in load zone - triggers loading of molds */
							if (WTW.actionZones[i].actionzonename.toLowerCase().indexOf("extreme") > -1 && WTW.actionZones[i].actionzonename.toLowerCase().indexOf("custom") == -1) {
								if (WTW.actionZones[i].status == 0) {
									WTW.addLoadZoneToQueue(i);
								}
							}
							/* loads JavaScripts specifically for action zone */
							WTW.checkLoadScripts(i);
							/* trigger a pageview in analytics if set */
							WTW.checkAnalytics(i);
							/* status 2 means loaded */
							WTW.actionZones[i].status = 2;
						} else if (zmeinzone == false && zmoldname.indexOf("loadzone") > -1 && WTW.actionZones[i].status != 0) {
							if (WTW.actionZones[i].actionzonename.toLowerCase().indexOf("extreme") > -1 && WTW.actionZones[i].actionzonename.toLowerCase().indexOf("custom") == -1) {
								/* if avatar left zone, unload zone */
								if (WTW.actionZones[i].status == 2) {
									WTW.addUnloadZoneToQueue(i);
								}
							}
							/* status 0 means unloaded */
							WTW.actionZones[i].status = 0;
						} else if (zmoldname.indexOf("loadanimations") > -1) {
							/* when in zone, see if there are animations defined to load */
							WTW.checkLoadAnimations(i);
						} else if (zmoldname.indexOf("clickactivated") > -1) {
							/* action zone for click activated items (not in use yet) */
						} else if (zmoldname.indexOf("door") > -1 && WTW.actionZones[i].status != 4 && WTW.actionZones[i].status != 3) {
							/* status 3 means opening door - status 4 means door is fully open */
							WTW.actionZones[i].status = 3;
						} else if (zmoldname.indexOf("mirror") > -1 && WTW.actionZones[i].status != 2) {
							/* mirror zone loads objects into the mirror reflection */
							WTW.actionZones[i].status = 2;
							WTW.checkMirrorReflectionList(i);
						} else if (zmeinzone && zmoldname.indexOf("ridealong") > -1) {
							/* when in ride along zone, set the avatar parent to zone parent to move with the parent and recalculate relative position */
							WTW.checkRideAlongZone(zactionzone, i, zmeinzone, zothersinzone);
						}
					} else {
						if (zmoldname.indexOf("loadzone") > -1 && WTW.actionZones[i].status != 0) {
							/* if avatar is not in the load zone, unload molds identified by that zone */
							if (WTW.actionZones[i].actionzonename.toLowerCase().indexOf("extreme") > -1 && WTW.actionZones[i].actionzonename.toLowerCase().indexOf("custom") == -1) {
								/* if avatar is not in parent zone, unload the zone itself */
								if (WTW.actionZones[i].status == 2) {
									WTW.addUnloadZoneToQueue(i);
								}
							}
							/* if there were JavaScripts loaded with the zone, unload them */
							WTW.checkUnloadScripts(i);
							/* status 0 means not in zone */
							WTW.actionZones[i].status = 0;
						} else if (zmoldname.indexOf("clickactivated") > -1) {
							/* action zone for click activated items (not in use yet) */
						} else if (zmoldname.indexOf("door") > -1 && WTW.actionZones[i].status != 2 && WTW.actionZones[i].status != 1 && WTW.actionZones[i].status != 0) {
							/* door status 2 means closing door, status 0 means door closed */
							WTW.actionZones[i].status = 2;
						} else if (zmoldname.indexOf("mirror") > -1 && WTW.actionZones[i].status != 2) {
							/* mirror status 0 means not in zone, unload reflection list */
							WTW.actionZones[i].status = 0;
							WTW.checkMirrorReflectionList(i);
						} else if (zmeinzone == false && zmoldname.indexOf("ridealong") > -1) {
							/* when avatar returns from ride along zone, set the avatar parent to scene parent and recalculate position */
							WTW.checkRideAlongZone(zactionzone, i, zmeinzone, zothersinzone);
						}
					}
					/* allow hooks for plugins to add code on check zone (mostly for custom zones or to add functions to an existing zone) */
					WTW.pluginsCheckActionZone(zmoldname, i, zmeinzone, zothersinzone);
				} else if (zmoldname.indexOf("loadzone") > -1) {
					/* if loadzone not otherwise defined, set status to avaatr not in zone */
					WTW.actionZones[i].status = 0;
				}
			}
		}
		if (WTW.activityTimer != null && WTW.myAvatar != null) {
			/* reset hold position to check for movement and reset the activity timer */
			if (WTW.holdPosition != WTW.myAvatar.position.x + "|" + WTW.myAvatar.position.y + "|" + WTW.myAvatar.position.z) {
				WTW.holdPosition = WTW.myAvatar.position.x + "|" + WTW.myAvatar.position.y + "|" + WTW.myAvatar.position.z;
				WTW.resetActivityTimer();
			}
		}
		/* this variable tells the render cycle that it is already executed, it must be true to execute function again. different places in code will trigger a true to force it to run the function on demand only */
		WTW.checkZones = false;
	} catch(ex) {
		WTW.log("core-scripts-actionzones-wtw_actionzonefunctions.js-checkActionZones=" + ex.message);
	}
}

WTWJS.prototype.checkAvatarsInZone = function(zactionzone) {
	/* for future use - to check if a multiplayer avatar is in the action zone */
	var zinzone = false;
	try {
		//zmeinzone = WTW.myAvatar.intersectsMesh(zactionzone, false);
		
		
		
	} catch (ex) {
		WTW.log("core-scripts-actionzones-wtw_actionzonefunctions.js-checkAvatarsInZone=" + ex.message);
	}
	return zinzone;
}

WTWJS.prototype.checkLoadAnimations = function(zactionzoneind) {
	/* when an avatar walks into a Load Animation action zone, this function checks for an animations list to load to your avatar */
	try {
		if (WTW.actionZones[zactionzoneind] != null) {
			if (WTW.actionZones[zactionzoneind].avataranimations != null) {
				if (WTW.actionZones[zactionzoneind].avataranimations.length > 0) {
					var zazanimations = WTW.actionZones[zactionzoneind].avataranimations;
					for (var i=0;i < zazanimations.length;i++) {
						if (zazanimations[i] != null) {
							var zactionzone = scene.getMeshByID(WTW.actionZones[zactionzoneind].moldname);
							if (zactionzone != null) {
								var zavatar = scene.getMeshByID("myavatar-" + dGet("wtw_tinstanceid").value);
								if (zavatar != null) {
									var zmeinzone = zavatar.intersectsMesh(zactionzone, false);
									if (zmeinzone) {
										if (zavatar.WTW != null) {
											if (zavatar.WTW.animations != null) {
												if (zavatar.WTW.animations.running != null) {
													if (zavatar.WTW.animations.running[zazanimations[i].animationevent] == undefined) {
														var zanimationloop = true;
														if (zazanimations[i].animationloop == '0') {
															zanimationloop = false;
														}
														WTW.loadAvatarAnimation(zavatar.name, '', zazanimations[i].animationfriendlyname, zazanimations[i].animationicon, zazanimations[i].avataranimationid, zazanimations[i].animationevent, zazanimations[i].objectfolder, zazanimations[i].objectfile, zazanimations[i].startframe, zazanimations[i].endframe, zazanimations[i].speedratio, 0, zazanimations[i].loadpriority, zanimationloop, null);
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}	
			}
		}
	} catch (ex) {
		WTW.log("core-scripts-actionzones-wtw_actionzonefunctions.js-checkLoadAnimations=" + ex.message);
	}
}

WTWJS.prototype.checkRideAlongZone = function(zactionzone, zactionzoneind, zmeinzone, zothersinzone) {
	/* see if avatar entered a ride along zone - if so, change the parent and transpose the position and rotation */
	try {
		var zavatarparentname = '';
		var zactionzoneparentname = '';
		if (WTW.myAvatar.parent != null) {
			zavatarparentname = WTW.myAvatar.parent.id;
		}
		if (zactionzone.parent != null) {
			zactionzoneparentname = zactionzone.parent.id;
		}
		if (zmeinzone && zavatarparentname != zactionzoneparentname) {
WTW.log("add parent");
			WTW.myAvatar.position.x -= zactionzone.parent.position.x;
			WTW.myAvatar.position.y -= zactionzone.parent.position.y;
			WTW.myAvatar.position.z -= zactionzone.parent.position.z;
			WTW.myAvatar.parent = zactionzone.parent;
			
		} else if (zmeinzone == false && zavatarparentname == zactionzoneparentname) {
WTW.log("remove parent");
			WTW.myAvatar.position.x += zactionzone.parent.position.x;
			WTW.myAvatar.position.y += zactionzone.parent.position.y;
			WTW.myAvatar.position.z += zactionzone.parent.position.z;
			WTW.myAvatar.parent = WTW.mainParentMold;
			
		} 
	} catch (ex) {
		WTW.log("core-scripts-actionzones-wtw_actionzonefunctions.js-checkRideAlongZone=" + ex.message);
	}
}

WTWJS.prototype.initMirrorLoadZone = function(zmoldname, zmolddef) {
	try {
/*		var zmold = scene.getMeshByID(zmoldname);
		if (zmold != null) {
			var znamepart;
			if (zmoldname.indexOf("-") > -1) {
				znamepart = zmoldname.split('-');
				var zwebtype = znamepart[0];
				var zmoldind = Number(znamepart[1]);
				var zmolds = null;
				switch (zwebtype) {
					case "thingmolds":
						zmolds = WTW.thingMolds;
						break;
					case "buildingmolds":
						zmolds = WTW.buildingMolds;
						break;
					case "communitymolds":
						zmolds = WTW.communitiesMolds;
						break;
				}
				if (zmolds != null) {
					if (zmolds[zmoldind] != null) {
						if (zmolds[zmoldind].mirroractionzoneid == "") {
							var zactionzoneid = WTW.getRandomString(16);
							zmolds[zmoldind].mirroractionzoneid = zactionzoneid;
							var zactionzoneind = WTW.getNextCount(WTW.actionZones);
							WTW.actionZones[zactionzoneind] = WTW.newActionZone();
							WTW.actionZones[zactionzoneind].actionzoneid = zactionzoneid;
							WTW.actionZones[zactionzoneind].actionzonetype = "mirror";
							WTW.actionZones[zactionzoneind].actionzoneshape = "box";
							WTW.actionZones[zactionzoneind].status = 0;
							WTW.actionZones[zactionzoneind].shown = "0";
							WTW.actionZones[zactionzoneind].parentname = zmoldname;
							if (communityid != "") {
								var zbuildingid = "";
								if (communityid != "" && zwebtype == "buildingmolds" && zmolds[zmoldind].buildinginfo.buildingid != undefined) {
									zbuildingid = zmolds[zmoldind].buildinginfo.buildingid;
								}
								WTW.actionZones[zactionzoneind].communityinfo.communityid = communityid;
								WTW.actionZones[zactionzoneind].buildinginfo.buildingid = zbuildingid;
							} else if (buildingid != "") {
								WTW.actionZones[zactionzoneind].buildinginfo.buildingid = buildingid;
							} else if (thingid != "") {
								WTW.actionZones[zactionzoneind].thinginfo.thingid = thingid;
							}
							var zscalingx = zmold.scaling.x * 2;
							var zscalingy = zmold.scaling.y * 2;
							var zscalingz = zmold.scaling.z * 2;
							if (zscalingx < 60) {
								zscalingx = 60;
							}
							if (zscalingy < 60) {
								zscalingy = 60;
							}
							if (zscalingz < 60) {
								zscalingz = 60;
							}
							WTW.actionZones[zactionzoneind].scaling.x = zscalingx;
							WTW.actionZones[zactionzoneind].scaling.y = zscalingy;
							WTW.actionZones[zactionzoneind].scaling.z = zscalingz;
							WTW.setShownMolds();
						}
					}
				}
			}
		}*/
	} catch (ex) { 
		WTW.log("core-scripts-actionzones-wtw_actionzonefunctions.js-initMirrorLoadZone=" + ex.message);
	}
}
