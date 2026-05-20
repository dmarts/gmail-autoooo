function updateOOOSignature() {
  // ==========================================
  // ⚙️ CONFIGURATION ZONE
  // ==========================================
  const CONFIG = {
    lookaheadMonths: 3,
    htmlFileName: 'signature' // Name of the HTML file (without the .html extension)
  };
  // ==========================================

  // 1. Safely load the base signature from the external HTML file
  let baseSignature = "";
  try {
    baseSignature = HtmlService.createHtmlOutputFromFile(CONFIG.htmlFileName).getContent();
  } catch (e) {
    Logger.log(`Error: Could not find or load the HTML file named '${CONFIG.htmlFileName}.html'.`);
    return; // Exit the script early if the design file is missing
  }

  // 2. Calendar processing
  const now = new Date();
  const futureDate = new Date();
  futureDate.setMonth(now.getMonth() + CONFIG.lookaheadMonths);

  const calendarId = 'primary';
  const optionalArgs = {
    timeMin: now.toISOString(),
    timeMax: futureDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  };

  const response = Calendar.Events.list(calendarId, optionalArgs);
  const items = response.items || [];

  let daysSet = new Set();

  items.forEach(item => {
    const title = (item.summary || "").toUpperCase();
    const isNativeOOO = item.eventType === 'outOfOffice';
    const hasOOOKeyword = title.includes("OOO");

    if (isNativeOOO || hasOOOKeyword) {
      let startD, endD;

      if (item.start.date) {
        let [sY, sM, sD] = item.start.date.split('-');
        startD = new Date(sY, sM - 1, sD, 12, 0, 0); 
        
        let [eY, eM, eD] = item.end.date.split('-');
        endD = new Date(eY, eM - 1, eD, 12, 0, 0);
        endD.setDate(endD.getDate() - 1); 
      } else {
        let tempS = new Date(item.start.dateTime);
        startD = new Date(tempS.getFullYear(), tempS.getMonth(), tempS.getDate(), 12, 0, 0);
        
        let tempE = new Date(new Date(item.end.dateTime).getTime() - 1000);
        endD = new Date(tempE.getFullYear(), tempE.getMonth(), tempE.getDate(), 12, 0, 0);
      }

      let current = new Date(startD.getTime());
      while (current <= endD) {
        let y = current.getFullYear();
        let m = String(current.getMonth() + 1).padStart(2, '0');
        let d = String(current.getDate()).padStart(2, '0');
        daysSet.add(`${y}-${m}-${d}`);
        current.setDate(current.getDate() + 1);
      }
    }
  });

  // 3. Group and sort dates
  let todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let uniqueDays = Array.from(daysSet).filter(day => day >= todayStr).sort();

  let grouped = [];
  if (uniqueDays.length > 0) {
    let currentBlock = { start: uniqueDays[0], end: uniqueDays[0] };
    
    for (let i = 1; i < uniqueDays.length; i++) {
      let prevDay = new Date(currentBlock.end + "T12:00:00");
      let nextDay = new Date(uniqueDays[i] + "T12:00:00");
      let diffDays = Math.round((nextDay - prevDay) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentBlock.end = uniqueDays[i]; 
      } else {
        grouped.push(currentBlock); 
        currentBlock = { start: uniqueDays[i], end: uniqueDays[i] };
      }
    }
    grouped.push(currentBlock);
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function getOrdinal(d) {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; }
  }

  let formattedDates = grouped.map(block => {
    let sDate = new Date(block.start + "T12:00:00");
    let eDate = new Date(block.end + "T12:00:00");
    let sd = sDate.getDate(), sm = months[sDate.getMonth()];
    let ed = eDate.getDate(), em = months[eDate.getMonth()];
    
    if (sd === ed && sm === em) return `${sd}${getOrdinal(sd)} ${sm}`;
    if (sm === em) return `${sd}-${ed}${getOrdinal(ed)} ${sm}`;
    return `${sd}${getOrdinal(sd)} ${sm} - ${ed}${getOrdinal(ed)} ${em}`;
  });

  // 4. Update Gmail Primary Alias
  let finalSignature = baseSignature; // Pulls from the loaded HTML file
  if (formattedDates.length > 0) {
    finalSignature += `<br><br><span style="color:#5f6368; font-size: small;"><i><b>Upcoming planned absences:</b><br>${formattedDates.join(", ")}</i></span>`;
  }

  try {
    const sendAsResponse = Gmail.Users.Settings.SendAs.list('me');
    const primaryAlias = sendAsResponse.sendAs.find(alias => alias.isPrimary === true);
    
    if (primaryAlias) {
      Gmail.Users.Settings.SendAs.patch({ signature: finalSignature }, 'me', primaryAlias.sendAsEmail);
      Logger.log(`Success: Updated ${primaryAlias.sendAsEmail}. Blocks: ${formattedDates.join(" | ")}`);
    } else {
       Logger.log("Error: Could not find a primary SendAs alias.");
    }
  } catch (e) {
    Logger.log(`Error updating signature: ${e.message}`);
  }
}
