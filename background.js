injectContentScripts()

async function injectContentScripts(){

    /* inject into a tab every 3 seconds, so the browser doesnt get too overloaded at once */
    // This can be customized
    const INJECT_INTERVAL = 3000;
  
    // all tabs
    const tabs = await getTabs();
    console.log("TABS", tabs);
    let injectedTabsCount = 0;
  
    /* bring all the active tabs to the end */
    const activeTabsIds = tabs.filter(tab => {
      if(tab.active){
        return true;
      }
      return false;
    }).map(tab => tab.id);
    // all tabs (IDs)
    const tabsIds = tabs.map(tab => tab.id);
    activeTabsIds.forEach(tabId => bringTabToEnd(tabId));
  
    // move the tab that is active && that is in the current window to the end
    // TOFIX: if the user isnt in a browser window, getCurrentTab will return undefined.
    const currentTabId = (await getCurrentTab()).id;
    bringTabToEnd(currentTabId);
  
    // start injecting content scripts into tabs
    injectIntoTab();
  
    chrome.tabs.onActivated.addListener(onTabActivated);
  
    function injectIntoTab(){
  
      // inject the last tab the users browser
      const tabId = tabsIds[tabsIds.length - 1];
      console.log("injecting into tab id", tabId);
      chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ["content.js"],
      }, result => {
  
          console.log("RESULT", result);
  
          injectedTabsCount += 1;
  
          // remove this tab since it has just been injected
          tabsIds.splice(tabsIds.indexOf(tabId), 1);
  
          if(tabsIds.length === 0){ // no more tabs to inject
            chrome.tabs.onActivated.removeListener(onTabActivated);
            return;
          }
  
          const lastErr = chrome.runtime.lastError;
          console.log("Error", lastErr);
          if(lastErr) // tab was not injected with content script. Possible reasons are the tab has been closed, or the tab is not allowed to be injected with content scripts e.g tabs with urls of chrome://, chrome-extension:// etc.
            injectIntoTab();
          else
            setTimeout(injectIntoTab, INJECT_INTERVAL);
      });
    }
  
    function bringTabToEnd(tabId){
      // bring tab to the end of the array so it gets injected next
      tabsIds.splice(tabsIds.indexOf(tabId), 1);
      tabsIds.push(tabId);
    }
  
    function onTabActivated(activeInfo){
      // when a tab has been activated, inject it next
      const tabId = activeInfo.tabId;
      if(tabsIds.indexOf(tabId) !== -1)
        bringTabToEnd(tabId);
    }
  
}