# Setup to work on the backend in VS Code

TL:DR:
1. Open the/app directory in vscode.
2. Make sure you have both the [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) and [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extensions installed.
3. Open the Command Palate by pressing `CTRL+SHIFT+P`
4. Start typing `Reopen in Container`
5. Navigate to and hit ENTER on the `Remote-Containers: Reopen in Container` option. This will reopen the current directory open in VSCode into a container.

From here you can debug the backend as you would any Python application in VS Code.

## Prerequisites

Install the following extensions
* [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
* [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
* [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) (The Python extension is auto installed when loading app dir in container as per devcontainer.json)
* Some language server like [Pylance](https://marketplace.visualstudio.com/items?itemName=ms-python.vscode-pylance)


## 1. Open the `app` sub-directory in VS Code 

This will not work if you open any subdirectory inside the `app` folder such as the `backend` directory, Python will spit out errors about the lack of `pip` and other stuff (let me know if you can get this working).

## 2. Reopen this directory in a container

Either click on the icon of two arrows pointing at each other in the lower left and select "Reopen in Container" or open the Command Palete (CTRL + SHIFT + P on Windows), search for "Reopen in Container" and press enter on the option "Remote-containers: Reopen in COntainer.

This automatically builds and reopens the `app` directory in a container (default directory is `workspace` which has the contents of the `app` directory)

From here you can interact with the codebase as if you were using VS Code regularly. Check to see if the backend runs properly by navigating to `app.py` and hitting CTRL + F5 (on Windows)

If the backend runs properly, you can continue with debugging the code as you normally would in VS Code.

Let me or one of the other devs know if there are any issues with this and any issues will be addressed ASAP.
