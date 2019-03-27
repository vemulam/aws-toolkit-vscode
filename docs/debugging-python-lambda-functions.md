# Debugging Python lambda functions

These instructions outline how you can debug a lambda handler locally using the SAM CLI, and attach the VS Code debugger to it.

## Install and configure prerequisites

1. Install the [AWS Toolkit for Visual Studio Code](https://github.com/aws/aws-toolkit-vscode#getting-started).
2. Install the [Python extension for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ms-python.python). This extension gives VS Code the ability to debug Python applications.
3. Launch Visual Studio Code and open a SAM application or create a new one. <!-- TODO: Link to separate doc with instructions. -->
4. Open a terminal at the root of your application and configure `virtualenv` by running `python -m venv ./.venv`.

## Instrument your code

1. Add the line `ptvsd==4.2.4` to `<app root>/requirements.txt`
2. Open a terminal in `<app root>`, then run:

    ```bash
    # Bash
    . ./.venv/Scripts/activate
    python -m pip install -r requirements.txt
    ```

    ```powershell
    # PowerShell
    .\.venv\Scripts\Activate.ps1
    python -m pip install -r requirements.txt
    ```

3. Select a port to use for debugging. In this example, we will use port `5678`.
4. Add the following code to the beginning of your lambda handler in `app.py`:

    ```python
    print("waiting for debugger to attach...")
    ptvsd.enable_attach(address=('0.0.0.0', 5678), redirect_output=True)
    ptvsd.wait_for_attach()
    ```

## Configure your debugger

1. Open `<app root>/.vscode/launch.json` (create a new file if it does not already exist), and add the following contents:

    ```jsonc
    {
        "version": "0.2.0",
        "configurations": [
            {
                "name": "Python: Remote Attach",
                "type": "python",
                "request": "attach",
                "port": 5678,
                "host": "localhost",
                "pathMappings": [
                    {
                        "localRoot": "${workspaceFolder}/hello_world",
                        "remoteRoot": "/var/task"
                    }
                ]
            }
        ]
    }
    ```

2. Launch Visual Studio Code and open the folder containing your application.
3. Press `Ctrl+Shift+D` or click the `Debug` icon to open the debug viewlet:

    ![Debug Icon](./images/view_debug.png)

4. Select `Python: Remote Attach` from the drop-down menu at the top of the viewlet:

    ![Launch Configuration](./images/select_launch_config.png)

## Start debugging

1. Set a breakpoint in your lambda handler somewhere after the line `ptvsd.wait_for_attach()`.
2. Open a terminal in `<app root>`, and run the following commands. The SAM CLI will invoke your lambda handler, and wait for a debugger to attach to it.

    ```bash
    # Bash
    . ./.venv/Scripts/activate
    echo '{}' | sam local invoke HelloWorldFunction -d 5678
    ```

    ```powershell
    # PowerShell
    .\.venv\Scripts\Activate.ps1
    echo '{}' | sam local invoke HelloWorldFunction -d 5678
    ```

3. When you see `waiting for debugger to attach...`, go back to Visual Studio Code and press F5 to attach the debugger to the handler that you invoked in the previous step.

## Optional: Automatically start debugging when ready

With the above steps, you need to manually invoke SAM CLI from the command line, wait for it to be ready, then attach the debugger. We can automate the process of invoking SAM CLI and waiting for it to be ready by using a `preLaunchTask`.

1. Open `<app root>/.vscode/tasks.json` (create a new file if it does not already exist).
2. Add the following contents to `tasks.json`:

    ```jsonc
    {
        "label": "Debug Python Lambda Function",
        "type": "shell",
        "command": "sam",
        "args": [
            "local",
            "invoke",
            "HelloWorldFunction", // Replace this with the resource name of your lambda function from your Serverless Application template.yaml file
            "--template",
            "${workspaceFolder}/template.yaml", // Replace this with the appropriate workspace-relative path to your Serverless Application template.yaml file
            "--event",
            "${workspaceFolder}/event.json", // Replace this with the appropriate workspace-relative path to your event.json file
            "-d",
            "5678"
        ],
        "isBackground": true,
        "problemMatcher": {
            "pattern": [
                {
                    // Use regex that never matches anything.
                    "regexp": "^(x)(\\b)(x)$",
                    "file": 1,
                    "location": 2,
                    "message": 3
                }
            ],
            "background": {
                // This is how the debugger knows when it can attach
                "activeOnStart": true,
                "beginsPattern": "^Fetching lambci.* Docker container image......$",
                "endsPattern": "^waiting for debugger to attach...$"
            }
        }
    }
    ```

3. Open `<app root>/.vscode/launch.json`, and add the following property to the `Python: Remote Attach` configuration that you created earlier:

    ```jsonc
    "preLaunchTask": "Debug Python Lambda Function"
    ```

Now you can just press `F5`, and Visual Studio Code will invoke SAM CLI and wait for the `waiting for debugger to attach...` message before attaching the debugger.