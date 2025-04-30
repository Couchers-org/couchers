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

## 1. Reopen the `app` directory with the Dev Containers extension

Open the `app` sub-directory (where the .devcontainer folder is located) in an other VSCode window and reopen it in a container. To do so either click on the icon of two arrows pointing at each other in the lower left and select "Reopen in Container" or by opening the Command Palete (**CTRL/CMD+SHIFT+P**).

This automatically builds and reopens the `app` directory in a container (default directory is `workspace` which has the contents of the `app` directory).

Sometimes can be usefull to rebuild the container fo fix some issues. You can do this by clicking on the icon of two arrows pointing at each other in the lower left and select "Rebuild Container" or if this does not work from the Command Palete (**CTRL/CMD+SHIFT+P**) by typing `Dev Containers: Rebuild in Container without Cache`.

## 2. Start the backend in debugging mode

Start the backend in debugging mode by using the Run and Debug tab (**F5**). A launch.json file is already provided in the `.vscode` directory and you can customize it to your needs.


