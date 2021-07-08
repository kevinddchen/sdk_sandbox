# Matterport SDK Sandbox

The intention for this repo is to test and share SDK features.
We are using <a href="https://matterport.github.io/showcase-sdk/sdkbundle_home.html">SDK Bundle</a>, but it is very similar to the <a href="https://matterport.github.io/showcase-sdk/sdk_home.html">SDK for Embeds</a>.
Github hosts the branch `main` to the domain name <a href="https://kevinddchen.github.io/sdk_sandbox">kevinddchen.github.io/sdk_sandbox</a>. 

- <a href="index.html">index.html</a> contains the basic webpage---very simple, nothing much to see here.
- <a href="index.js">index.js</a> contains the Javascript that interacts with the Matterport SDK.

There are two options to test out features during development:
- Host locally: run `python3 -m http.server` on command line in your local directory, and then navigate to `localhost:8000` in your web browser. Remember to <em>hard refresh</em> each time!
- Create your own branch and develop there. The site can host any branch, not just `main`.
Try not to commit directly to `main`.
