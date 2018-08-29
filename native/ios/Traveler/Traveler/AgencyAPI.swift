//
//  AgencyAPI.swift
//  Traveler
//
//  Created by Gabe Smedresman on 12/12/16.
//  Copyright © 2016 First Person Travel. All rights reserved.
//

import Alamofire
import CoreLocation
import Foundation

class AgencyAPI {
    
    var alamoFireManager:Alamofire.SessionManager

    static let sharedInstance = AgencyAPI()
    
    fileprivate init() {
        // Configure timeout for Alamo fire so requests don't get too
        // tangled up with low reception.
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 20
        configuration.timeoutIntervalForResource = 20
        self.alamoFireManager = Alamofire.SessionManager(configuration: configuration)
    }
    
    func transmitLocation(_ location: CLLocation) {
        // Don't transmit if we aren't logged in yet
        if self.userId == nil || self.apiHost == nil {
            return
        }
        
        // Transmit location to server
        let url:String = "\(self.apiHost!)/api/users/\(self.userId!)/device_state"
        let state:UIApplicationState = UIApplication.shared.applicationState
        let parameters:Parameters = [
            "location_latitude": location.coordinate.latitude,
            "location_longitude": location.coordinate.longitude,
            "location_accuracy": location.horizontalAccuracy,
            "location_timestamp": Int(location.timestamp.timeIntervalSince1970),
            "device_battery": UIDevice.current.batteryLevel,
            "device_is_active": state == .active ? "true": "false"
        ]
        NSLog("posting %@, %@", url, parameters)
        self.alamoFireManager
            .request(url, method: .post, parameters: parameters)
            .response { response in
//                print(response.response)
//                print(response.data)
//                print(response.error)
            }
    }
    
    func registerDevice(_ deviceTokenHex: String) {
        // Don't transmit if we aren't logged in yet
        if self.userId == nil || self.apiHost == nil {
            return
        }
        let url:String = "\(self.apiHost!)/api/users/\(self.userId!)"
        let parameters:Parameters = [
            "devicePushToken": deviceTokenHex
        ]
        NSLog("patching %@, %@", url, parameters)
        self.alamoFireManager
            .request(url, method: .put, parameters: parameters)
            .response { response in
//                print(response.response)
//                print(response.data)
//                print(response.error)
            }
    }

    var apiHost: String? {
        get {
            let defaults = UserDefaults.standard
            return defaults.string(forKey: "apiHost")
        }
        set(newUserId) {
            let defaults = UserDefaults.standard
            defaults.setValue(newUserId, forKey: "apiHost")
            defaults.synchronize()
        }
    }
    
    var userId: String? {
        get {
            let defaults = UserDefaults.standard
            return defaults.string(forKey: "userId")
        }
        set(newUserId) {
            let defaults = UserDefaults.standard
            defaults.setValue(newUserId, forKey: "userId")
            defaults.synchronize()
        }
    }
}
