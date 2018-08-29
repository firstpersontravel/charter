
import Foundation
import UIKit
import GCDWebServer
import UserNotifications
import Zip

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var webServer: GCDWebServer?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {

        // Clear badges
        UIApplication.shared.applicationIconBadgeNumber = 0
        
        // Monitor batteries
        UIDevice.current.isBatteryMonitoringEnabled = true
        
        // Register for push
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) {
            (granted, error) in
            // Parse errors and track state
        }
        application.registerForRemoteNotifications()
        
        // Define document path
        let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
        let websitePath = documentsPath + "/website"

        // Should we reset the app to what's stored in the bundle?
        var shouldResetApp = false
        
        // Check if we should reset the application based on the config panel.
        if UserDefaults.standard.bool(forKey: "RESET_APP_KEY") {
            UserDefaults.standard.set(false, forKey: "RESET_APP_KEY")
            shouldResetApp = true
        }
        
        // If bundle path is newer than the website path (we've done a code update)
        // then clear the website path to copy the bundle over. Otherwise keep what we
        // have.
        let zipPath = Bundle.main.bundlePath + "/www/dist.zip"
        do {
            // Pick a file in the website path that we know will always exist.
            let buildTimestampPath = websitePath + "/dist/build_timestamp.txt"
            let websiteAttrs = try FileManager.default.attributesOfItem(atPath: buildTimestampPath)
            let websiteModified = websiteAttrs[FileAttributeKey.modificationDate] as! Date

            let bundleAttrs = try FileManager.default.attributesOfItem(atPath: zipPath)
            let bundleModified = bundleAttrs[FileAttributeKey.modificationDate] as! Date

            if bundleModified > websiteModified {
                print("Bundle is more recent than saved website data; resetting app to bundle state.")
                shouldResetApp = true
            } else {
                print("Saved website is more recent than bundle; leaving app alone.")
            }
        } catch let err {
            // do nothing!
            print("Bundle website date check failed.")
            print(err.localizedDescription)
        }
        
        // Overwrite path with zipped bundle
        if shouldResetApp || !FileManager.default.fileExists(atPath: websitePath) {
            try? FileManager.default.createDirectory(atPath: websitePath, withIntermediateDirectories: true, attributes: nil)
            try! Zip.unzipFile(
                URL(fileURLWithPath: zipPath),
                destination: URL(string:websitePath)!,
                overwrite: true,
                password: nil
            )
        }
        
        // Launch web server
        self.webServer = GCDWebServer()
        
        // 0 = debug, 1 = verbose, 2 = info
        GCDWebServer.setLogLevel(1)
        
        // Script content
        self.webServer!.addGETHandler(
            forBasePath: "/media/theheadlandsgamble/",
            directoryPath: Bundle.main.bundlePath + "/media/",
            indexFilename: nil,
            cacheAge: 3600,
            allowRangeRequests: true
        )

        // Static media
        self.webServer!.addGETHandler(
            forBasePath: "/static/",
            directoryPath: Bundle.main.bundlePath + "/static/",
            indexFilename: nil,
            cacheAge: 3600,
            allowRangeRequests: true
        )

        // JS resources
        self.webServer!.addHandler(
            forMethod: "GET",
            pathRegex: "^/travel/dist/.*",
            request: GCDWebServerRequest.self,
            processBlock: {request in
                // remove /travel from path
                let subpathIndex = request.path.index(request.path.startIndex, offsetBy: 7)
                let subpath = request.path[subpathIndex...]
                let filepath = websitePath + subpath
                if FileManager.default.fileExists(atPath:filepath) {
                    let response = GCDWebServerFileResponse(file:filepath)
                    response!.eTag = ""
                    response!.cacheControlMaxAge = 0
                    return response
                } else {
                    print("File not found: \(filepath)")
                    return GCDWebServerErrorResponse(statusCode: 404)
                }
            }
        )

        // Index page
        self.webServer!.addHandler(forMethod: "GET",
            pathRegex: "^/travel/(u/.*|$)",
            request: GCDWebServerRequest.self,
            processBlock: {request in
                let path = websitePath + "/dist/index.html"
                let response = GCDWebServerFileResponse(file:path)
                response!.eTag = ""
                response!.cacheControlMaxAge = 0
                return response
            }
        )
        
        self.webServer!.start(withPort: 8080, bonjourName: nil)
        print("GCD Server serving from: \(websitePath)")
        print("GCD Server running at: \(self.webServer!.serverURL)")

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // "Array" of all bytes:
        let deviceTokenBytes = UnsafeBufferPointer<UInt8>(start: (deviceToken as NSData).bytes.bindMemory(to: UInt8.self, capacity: deviceToken.count),
                                               count:deviceToken.count)
        // Array of hex strings, one for each byte:
        let deviceTokenHex = deviceTokenBytes
            .map { String(format: "%02hhx", $0) }
            .reduce("", { $0 + $1 })
        AgencyAPI.sharedInstance.registerDevice(deviceTokenHex)
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print(error)
    }
    
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any]) {
        // Got notification while open
        print(userInfo)
        UIApplication.shared.applicationIconBadgeNumber = 0
    }
}

