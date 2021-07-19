# Note: this repo is depreciated. We have moved to react: https://github.com/nwager-mp/sdk_pathfinder

# Matterport SDK Sandbox

The intention for this repo is to test and share our SDK prototypes.
We are using the <a href="https://matterport.github.io/showcase-sdk/sdkbundle_home.html">SDK Bundle</a>, but it is very similar to the <a href="https://matterport.github.io/showcase-sdk/sdk_home.html">SDK for Embeds</a>.
Github hosts a chosen branch at <a href="https://kevinddchen.github.io/sdk_sandbox">kevinddchen.github.io/sdk_sandbox</a>. 

### Current TODO list:
- Transition to React
- Pathfinding
  - Improve UI
  - Flythough
- Mattertag translation

### Development guidelines:
- Keep a clean master and develop on branches. Always rebase.
- Host locally to test: run `python3 -m http.server` on command line in your local directory, and then navigate to `localhost:8000` in your web browser. Remember to <em>hard refresh</em> to reload your JS!
