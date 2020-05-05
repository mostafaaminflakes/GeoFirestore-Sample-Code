import React, { Component } from "react";
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    YellowBox,
} from "react-native";
import _ from "lodash";
import { GeoFirestore } from "geofirestore";
import firebase from "../firestore/FirestoreInit";
import defaultLocations from "../screens/DummyLocations";

// Center
const centerLat = 24.7763642;
const centerLng = 46.6145054;

// Radius in KM
const radius = 20;

class FindNearestLocations extends Component {
    state = {
        locations: [],
        isLoading: false,
        isAdding: false,
        locationsAdded: false,
        noData: false,
    };

    constructor(props) {
        super(props);
        this.fixYellowWarning();
    }

    // Fix yellow box message: [Setting a timer for a long period of time]
    fixYellowWarning = () => {
        YellowBox.ignoreWarnings(["Setting a timer"]);
        const _console = _.clone(console);
        console.warn = (message) => {
            if (message.indexOf("Setting a timer") <= -1) {
                _console.warn(message);
            }
        };
    };

    showLoadingIndicator = () => {
        return (
            <ActivityIndicator
                style={{ height: 150 }}
                color="#C00"
                size="large"
            />
        );
    };

    addDummyLocations = () => {
        const geofirestore = new GeoFirestore(firebase.firestore());
        const geocollection = geofirestore.collection("locations");

        this.setState({ isAdding: true });

        defaultLocations.map(async (location) => {
            const doc = {
                name: location.name,
                coordinates: new firebase.firestore.GeoPoint(
                    location.lat,
                    location.lng
                ),
            };

            await geocollection.add(doc).then(() => {
                this.setState({ locationsAdded: true, isAdding: false });
            });
        });
    };

    getNearestLocations = () => {
        const firestore = firebase.firestore();
        const geofirestore = new GeoFirestore(firestore);
        const geocollection = geofirestore.collection("locations");

        this.setState({ isLoading: true });

        let query = geocollection.limit(10).near({
            center: new firebase.firestore.GeoPoint(centerLat, centerLng),
            radius: radius,
        });

        let prevState = this.state.locations;
        let joined = null;

        // Get query (as Promise)
        query.get().then(async (snapshot) => {
            if (snapshot.docs.length === 0) {
                this.setState({ isLoading: false, noData: true });
                return;
            } else {
                // sort results asc
                const sorted = snapshot.docs.sort(
                    (a, b) => a.distance - b.distance
                );

                await Promise.all(
                    sorted.map(async (doc) => {
                        let location = {
                            name: doc.data().name,
                            id: doc.id,
                            distance: Math.round(doc.distance),
                        };

                        joined = prevState.push(location);
                    })
                );

                this.setState({
                    locations: prevState,
                    isLoading: false,
                    noData: false,
                });
            }
        });
    };

    displayLocations = () => {
        return this.state.noData ? (
            <Text>No locations found!</Text>
        ) : (
            this.state.locations.map((location) => {
                return (
                    <View key={location.id} style={styles.padding}>
                        <Text>Location name: {location.name}</Text>
                        <Text>
                            Distance: {location.distance}
                            KM
                        </Text>
                    </View>
                );
            })
        );
    };

    render() {
        const { isLoading, isAdding, locationsAdded } = this.state;

        return (
            <ScrollView>
                <View style={styles.container}>
                    <TouchableOpacity onPress={() => this.addDummyLocations()}>
                        <Text style={[styles.padding, styles.fontSize]}>
                            Add 9 locations
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => this.getNearestLocations()}
                    >
                        <Text style={[styles.padding, styles.fontSize]}>
                            Get nearest locations
                        </Text>
                    </TouchableOpacity>

                    {isAdding ? (
                        this.showLoadingIndicator()
                    ) : locationsAdded ? (
                        <Text>Locations added.</Text>
                    ) : null}
                    {isLoading
                        ? this.showLoadingIndicator()
                        : this.displayLocations()}
                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 50,
    },
    padding: { padding: 5 },
    fontSize: { fontSize: 23 },
    line: { borderTopColor: "black", borderTopWidth: 1 },
});

export default FindNearestLocations;
