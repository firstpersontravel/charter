import AVFoundation
import Foundation
import UIKit
import WebKit
import CoreLocation
import Zip
import Alamofire

class ViewController: UIViewController, CLLocationManagerDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {

    let locationManager = CLLocationManager()
    var webView:WKWebView?

    var player: AVAudioPlayer?
    
    var lastLocation:CLLocation?
    var lastTransmittedLocation:Date?
    
    required init(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)!
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
       
        // Init location
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false

        // Request auth
        if CLLocationManager.authorizationStatus() == .notDetermined {
            locationManager.requestAlwaysAuthorization()
        }
        
        if CLLocationManager.authorizationStatus() == .authorizedAlways {
            // Significant updates
            // locationManager.startMonitoringSignificantLocationChanges()

            // All updates
            locationManager.distanceFilter = 10
            locationManager.startUpdatingLocation()
        }
        
        // Init JS events
        let controller = WKUserContentController()
        controller.add(self, name: "update_code")
        controller.add(self, name: "register_native_api_client")
        controller.add(self, name: "play_audio")
        controller.add(self, name: "stop_audio")
        
        // If we wanted to inject build vars
        // let javascriptString = "window.buildTimestamp = '\(buildTimestamp)';"
        // let script = WKUserScript(source: javascriptString, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        // controller.addUserScript(script)

        // Check if we should reset the application based on the config panel.
        if UserDefaults.standard.bool(forKey: "LOGOUT_KEY") {
            UserDefaults.standard.set(false, forKey: "LOGOUT_KEY")
             let javascriptString = "localStorage.clear();"
             let script = WKUserScript(source: javascriptString, injectionTime: .atDocumentStart, forMainFrameOnly: true)
             controller.addUserScript(script)
        }
        
        // Init web view configuration
        let configuration = WKWebViewConfiguration()
        configuration.userContentController = controller
        
        // Init web view
        let webView = WKWebView(
            frame: view.frame, 
            configuration: configuration
        )
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.scrollView.isScrollEnabled = false

        // Resize web view on page resize
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        view.addSubview(webView)
        
        // Load web page
        let url = URL(string:"http://localhost:8080/travel/")
        webView.load(URLRequest(url: url!))
        self.webView = webView
    }

    func webView(
            _ webView: WKWebView,
            decidePolicyFor
            navigationAction: WKNavigationAction,
            decisionHandler: (@escaping (WKNavigationActionPolicy) -> Void)) {

        let app = UIApplication.shared
        let url = navigationAction.request.url!
        
        // Allow facetime audio to be initiated from the app
        if url.scheme == "facetime-audio" || url.scheme == "facetime" || url.scheme == "skype" {
            if app.canOpenURL(url) {
                app.open(url, completionHandler: nil)
                decisionHandler(WKNavigationActionPolicy.cancel)
                return
            }
        }
        decisionHandler(WKNavigationActionPolicy.allow)
    }

    // JS METHODS

    func userContentController(_ userContentController: WKUserContentController,
                           didReceive message: WKScriptMessage) {
        NSLog("message name: \(message.name)")
        NSLog("message body: \(message.body)")
        if (message.name == "update_code") {
            let body = message.body as! [String:String]
            // Source url
            let zipUrl:String = body["zip_url"] as String!

            // Download path
            let downloadDestination: DownloadRequest.DownloadFileDestination = { _, _ in
                let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let fileURL = documentsURL.appendingPathComponent("temp.zip")
                return (fileURL, [.removePreviousFile, .createIntermediateDirectories])
            }

            // Unzip path
            let documentsPath = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)[0]
            print("Document Path: \(documentsPath)")
            let unzipPath:String = documentsPath + "/website"
            
            // Loading indicator
           let alert = UIAlertController(
               title: nil, message: "Downloading update...",
               preferredStyle: .alert)
           self.present(alert, animated: true, completion: nil)

            Alamofire
                .download(zipUrl, method: .get, to: downloadDestination)
                .validate(statusCode: 200..<300)
                .responseData { response in
                    debugPrint(response)

                    switch response.result {
                    case .success:
                        do {
                            try Zip.unzipFile(
                                response.destinationURL!,
                                destination: URL(string:unzipPath)!,
                                overwrite: true,
                                password: nil,
                                progress: { (progress) -> () in
                                    if progress == 1.0 {
                                        self.dismiss(animated: false, completion: nil)
                                        let javascriptString = "window.location.href = '/travel/';"
                                        self.webView!.evaluateJavaScript(javascriptString, completionHandler: nil)
                                    }
                            })
                        } catch {
                            print("Error unzipping")
                            self.dismiss(animated: false, completion: {
                                // Show error
                                let errorAlert = UIAlertController(title: "Error unzipping update", message: "Update failed", preferredStyle: .alert)
                                errorAlert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
                                self.present(errorAlert, animated: false)
                            })
                        }
                    
                     case .failure(let error):
                        print("Error : \(error)" )
                        self.dismiss(animated: false, completion: {
                            // Show error
                            let errorAlert = UIAlertController(title: "Error fetching update", message: "Update failed", preferredStyle: .alert)
                            errorAlert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
                            self.present(errorAlert, animated: false)
                        })
                    }
                }
            return
        }
        if (message.name == "register_native_api_client") {
            let body = message.body as! [String:String]
            AgencyAPI.sharedInstance.userId = body["user_id"]
            AgencyAPI.sharedInstance.apiHost = body["api_host"]
            if self.lastLocation != nil {
                transmitLocation(self.lastLocation!)
            }
            return
        }
        if (message.name == "play_audio") {
            let messageBody:NSDictionary = message.body as! NSDictionary
            do {
                let audioFullPath = messageBody["path"] as! String
                let audioTime = messageBody["time"] as! TimeInterval
                let audioPath = audioFullPath.split(separator: "/").dropLast().joined(separator: "/")
                let audioFilename = audioFullPath.split(separator: "/").last!
                let audioResource = audioFilename.split(separator: ".").dropLast().joined(separator: ".")
                let audioExt = String(audioFilename.split(separator: ".").last!)
                let audioUrl = Bundle.main.url(
                    forResource: audioResource,
                    withExtension: audioExt,
                    subdirectory: audioPath)
                
                try AVAudioSession.sharedInstance().setCategory(AVAudioSessionCategoryPlayback)
                try AVAudioSession.sharedInstance().setActive(true)
                player = try AVAudioPlayer(contentsOf: audioUrl!)
                guard let player = player else { return }
                player.currentTime = audioTime
                player.play()
            } catch let error {
                print(error.localizedDescription)
            }
        }
        if (message.name == "stop_audio") {
            if (player != nil) {
                player!.stop()
            }
        }
    }

    // LOCATION METHODS

    func locationManager(
            _ manager: CLLocationManager,
            didChangeAuthorization status: CLAuthorizationStatus) {

       if status == .authorizedAlways {
           manager.startMonitoringSignificantLocationChanges()
       }
    }
    
    func locationManager(
        _ manager: CLLocationManager,
        didUpdateLocations locations: [CLLocation]) {
        let location = locations.last! as CLLocation
        // NSLog("current position: \(location.coordinate.longitude) , \(location.coordinate.latitude)")
        self.lastLocation = location
        transmitLocation(location)
    }
    
    func transmitLocation(_ location: CLLocation) {        
        // Return if we've transmitted in last 15 seconds.
        // This leaves an open condition where latest location may not be transmitted
        // Fine for now.
        if self.lastTransmittedLocation != nil {
            let timeSinceTransmitted:TimeInterval = Date().timeIntervalSince(self.lastTransmittedLocation!)
            let minInterval = 5.0
            if timeSinceTransmitted < minInterval {
                NSLog("Skipping location update")
                return
            }
        }
        // Set time last transmitted to now
        self.lastTransmittedLocation = Date()
        
        // Update location on webview
        let msecTimestamp = location.timestamp.timeIntervalSince1970 * 1000
        let javascriptString = "window.nativeLocationUpdate(\(location.coordinate.latitude), " +
            "\(location.coordinate.longitude), \(location.horizontalAccuracy), \(msecTimestamp));"
        self.webView!.evaluateJavaScript(javascriptString, completionHandler: nil)
        
        // Transmit location to server
        AgencyAPI.sharedInstance.transmitLocation(location)
    }
    
    func locationManager(
        _ manager: CLLocationManager,
        didFailWithError error: Error) {
//        NSLog("locationManager didFailWithError: \(error.description)")
    }

    // UI METHODS

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: (@escaping () -> Void)) {
        print("webView:\(webView) runJavaScriptAlertPanelWithMessage:\(message) initiatedByFrame:\(frame) completionHandler:\(completionHandler)")
        
        let alertController = UIAlertController(title: frame.request.url?.host, message: message, preferredStyle: .alert)
        alertController.addAction(UIAlertAction(title: "OK", style: .default, handler: { action in
            completionHandler()
        }))
        self.present(alertController, animated: true, completion: nil)
    }
    
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: (@escaping (Bool) -> Void)) {
        print("webView:\(webView) runJavaScriptConfirmPanelWithMessage:\(message) initiatedByFrame:\(frame) completionHandler:\(completionHandler)")
        
        let alertController = UIAlertController(title: frame.request.url?.host, message: message, preferredStyle: .alert)
        alertController.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: { action in
            completionHandler(false)
        }))
        alertController.addAction(UIAlertAction(title: "OK", style: .default, handler: { action in
            completionHandler(true)
        }))
        self.present(alertController, animated: true, completion: nil)
    }
    
    func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        print("webView:\(webView) runJavaScriptTextInputPanelWithPrompt:\(prompt) defaultText:\(defaultText) initiatedByFrame:\(frame) completionHandler:\(completionHandler)")
        
        let alertController = UIAlertController(title: frame.request.url?.host, message: prompt, preferredStyle: .alert)
        weak var alertTextField: UITextField!
        alertController.addTextField { textField in
            textField.text = defaultText
            alertTextField = textField
        }
        alertController.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: { action in
            completionHandler(nil)
        }))
        alertController.addAction(UIAlertAction(title: "OK", style: .default, handler: { action in
            completionHandler(alertTextField.text)
        }))
        self.present(alertController, animated: true, completion: nil)
    }

    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

}

