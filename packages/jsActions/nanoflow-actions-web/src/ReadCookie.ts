// This file was generated by Mendix Studio Pro.
//
// WARNING: Only the following code will be retained when actions are regenerated:
// - the import list
// - the code between BEGIN USER CODE and END USER CODE
// - the code between BEGIN EXTRA CODE and END EXTRA CODE
// Other code you write will be lost the next time you deploy the project.

// BEGIN EXTRA CODE
// END EXTRA CODE

/**
 * @param {string} key
 * @returns {Promise.<string>}
 */
export async function ReadCookie(key: string): Promise<string> {
    // BEGIN USER CODE
    const value = document.cookie
        .split("; ")
        .find(row => row.startsWith(`${key}=`))
        ?.split("=")[1];

    return value ?? "";
    // END USER CODE
}
