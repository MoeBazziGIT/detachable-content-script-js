/* DETACHABLE */

const DetachableDOM = {
    // a list of detach jobs ie. unbinding event listeners, clear timers, remove DOM nodes etc.
    detachJobs: []
  }
  
  DetachableDOM.addEventListener = (target, type, listener, options) => {
    DetachableDOM.detachJobs.push({
      jobType: "removeEventListener",
      data: {
        target,
        type,
        listener,
        options
      }
    });
  
    return target.addEventListener(type, listener, options);
  }
  
  DetachableDOM.removeEventListener = (target, type, listener, options) => {
    let returnValue = undefined;
    // remove the job from jobs array and remove event listener
    DetachableDOM.detachJobs = DetachableDOM.detachJobs.filter(job => {
      if(job.jobType === "removeEventListener" && job.data.target === target && job.data.type === type && job.data.listener === listener && job.data.options === options){
        returnValue = target.removeEventListener(type, listener, options);
        return false;
      }
      return true;
    });
  
    return returnValue;
  }
  
  /* ADD NODE TO DOM */
  DetachableDOM.appendChild = (target, childNode) => {
    DetachableDOM.detachJobs.push({
      jobType: "removeNode",
      data: {
        node: childNode
      }
    });
  
    return target.appendChild(childNode);
  }
  
  DetachableDOM.insertBefore = (parentNode, newNode, referenceNode) => {
    DetachableDOM.detachJobs.push({
      jobType: "removeNode",
      data: {
        node: newNode
      }
    });
  
    return parentNode.insertBefore(newNode, referenceNode);
  }
  
  DetachableDOM.prepend = (target, newNode) => {
    DetachableDOM.detachJobs.push({
      jobType: "removeNode",
      data: {
        node: newNode
      }
    });
  
    return target.prepend(newNode);
  }
  
  DetachableDOM.remove = (nodeToRemove) => {
    let returnValue = undefined;
    // remove the job from jobs array and remove the node from DOM
    DetachableDOM.detachJobs = DetachableDOM.detachJobs.filter(job => {
      if(job.jobType === "removeNode" && job.data.node === nodeToRemove){
        returnValue = nodeToRemove.remove();
        return false;
      }
      return true;
    });
  
    return returnValue;
  }
  
  
  /* SETTING WINDOW TIMERS */
  DetachableDOM.setInterval = (func, delay) => {
    const id = setInterval(func, delay);
    DetachableDOM.detachJobs.push({
      jobType: "clearInterval",
      data: { id }
    });
    return id;
  }
  
  DetachableDOM.clearInterval = (id) => {
    let returnValue = undefined;
    // remove the job from jobs array and clear the interval
    DetachableDOM.detachJobs = DetachableDOM.detachJobs.filter(job => {
      if(job.jobType === "clearInterval" && job.data.id === id){
        returnValue = clearInterval(id);
        return false;
      }
      return true;
    });
  
    return returnValue;
  }
  
  DetachableDOM.setTimeout = (func, delay) => {
    const id = setTimeout(func, delay);
    DetachableDOM.detachJobs.push({
      jobType: "clearTimeout",
      data: { id }
    });
    return id;
  }
  
  DetachableDOM.clearTimeout = (id) => {
    let returnValue = undefined;
    // remove the job from jobs array and clear the timeout
    DetachableDOM.detachJobs = DetachableDOM.detachJobs.filter(job => {
      if(job.jobType === "clearTimeout" && job.data.id === id){
        returnValue = clearTimeout(id);
        return false;
      }
      return true;
    });
  
    return returnValue;
  }
  
  /* ADDING MUTATION OBSERVER */
  DetachableDOM.addMutationObserver = (callback) => {
    const mutationObserver = new MutationObserver(callback);
    DetachableDOM.detachJobs.push({
      jobType: "disconnectMutationObserver",
      data: {
        mutationObserver
      }
    });
    return mutationObserver;
  }
  
  DetachableDOM.disconnectMutationObserver = (mutationObserver) => {
    let returnValue = undefined;
    // remove the job from jobs array and disconnect the mutationObserver
    DetachableDOM.detachJobs = DetachableDOM.detachJobs.filter(job => {
      if(job.jobType === "disconnectMutationObserver" && job.data.mutationObserver === mutationObserver){
        returnValue = mutationObserver.disconnect();
        return false;
      }
      return true;
    });
  
    return returnValue;
  }
  
  /* function to detach all */
  DetachableDOM.detach = () => {
    // perform detach jobs ie. tear down content script
    DetachableDOM.detachJobs.forEach(job => {
      const { jobType, data } = job;
      const { target, type, listener, options, node, id, mutationObserver } = data;
      switch(jobType){
        case "removeEventListener":
          target.removeEventListener(type, listener, options);
          break;
        case "removeNode":
          node.remove();
          break;
        case "clearInterval":
          clearInterval(id);
          break;
        case "clearTimeout":
          clearTimeout(id);
          break;
        case "disconnectMutationObserver":
          mutationObserver.disconnect();
          break;
      }
    })
  }
  
  /* DETACHABLE END */
  
  /* CONTENT SCRIPT REINJECTER AND DESTRCUTOR */
  
  const detachEvent = 'DETACHABLE__DETACH' + chrome.runtime.id;
  // detach previous content script by dispatching out this custom event
  document.dispatchEvent(new CustomEvent(detachEvent));
  document.addEventListener(detachEvent, () => {
    DetachableDOM.detach();
  }, { once: true });