"use client"
import { api } from "@/api/axiosInstance"; // Added import
import { useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Feather } from "@expo/vector-icons"
import { useTheme } from "../../Context/ThemeContext"
import { format } from "date-fns"

// Import the ReservationProcess component
import ReservationProcess from "./ReservationProcess"

// Types and Interfaces
interface Reservation {
  customer?: string
  email?: string
  full_name?: string
  date?: string
  time?: string
  internal_note?: string
  source?: string
  number_of_guests?: string
  phone?: string
  status?: string
  commenter?: string
  review?: boolean
  occasion?: number | null
}

interface Client {
  id: string
  full_name: string
  tags: { name: string; id: number }[]
  email: string
  phone: string
  comment?: string
}

interface DataTypes {
  reserveDate: string
  time: string
  guests: number
}

interface AddReservationModalProps {
  isVisible: boolean
  onClose: () => void
  onSubmit: (data: Reservation) => void
  timeAndDate?: {
    date: string
    time: string
  }
  isDarkMode: boolean
}

interface Occasion {
  id: number
  name: string
}

const AddReservationModal = (props: AddReservationModalProps) => {
  const { colors, isDarkMode } = useTheme()

  // States
  const [searchKeyword, setSearchKeyword] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [count, setCount] = useState(0) // This might be set by fetchClients if API returns total count
  const [selectedOccasion, setSelectedOccasion] = useState<number | null>(null)
  const [occasions, setOccasions] = useState<Occasion[]>([])

  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        const response = await api.get("/api/v1/bo/occasions/");
        console.log("Occasions fetched:", response.data); // Debugging log
        setOccasions(response.data); // Adjust based on actual API response structure
      } catch (error) {
        console.error("Error fetching occasions:", error);
        // Optionally, set occasions to an empty array or show an error
        setOccasions([]);
      }
    };

    fetchOccasions();
  }, []);
  const [data, setData] = useState<DataTypes>({
    reserveDate: props.timeAndDate?.date || "",
    time: props.timeAndDate?.time || "",
    guests: 2,
  })
  const [focusedClient, setFocusedClient] = useState(false)
  const [inputName, setInputName] = useState("")
  const [formData, setFormData] = useState({
    customer: "",
    full_name: "",
    email: "",
    source: "BACK_OFFICE",
    phone: "",
    comment: "",
  })
  const [createUser, setCreateUser] = useState(true)
  // Replace the showProcess state with showReservationProcess
  const [showReservationProcess, setShowReservationProcess] = useState(false)
  const [newClient, setNewClient] = useState(false)
  const [findClient, setFindClient] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showGuestPicker, setShowGuestPicker] = useState(false)
  const [showOccasionSelectionModal, setShowOccasionSelectionModal] = useState(false); // New state for occasion modal

  const [newCustomerData, setNewCustomerData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    source: "BACK_OFFICE",
    note: "",
    title: "mr",
  })

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true); // Indicate loading state for client search
      try {
        const params = new URLSearchParams();
        if (searchKeyword) {
          params.append('search', searchKeyword);
        }
        // Add other params like page if pagination is needed for clients
        // params.append('page_size', '10'); 

        const response = await api.get(`/api/v1/bo/customers/?${params.toString()}`);
        
        // Assuming API response structure { results: Client[], count?: number }
        const fetchedClients = response.data.results || [];
        setClients(fetchedClients);
        setSearchResults(fetchedClients); // Update searchResults directly
        if (response.data.count !== undefined) {
          setCount(response.data.count);
        } else {
          setCount(fetchedClients.length);
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
        setClients([]);
        setSearchResults([]);
        setCount(0);
        // Optionally, show an error message to the user
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce fetching to avoid too many API calls while typing
    const debounceFetch = setTimeout(() => {
      fetchClients();
    }, 500); // Adjust debounce delay as needed

    return () => clearTimeout(debounceFetch);
  }, [searchKeyword]); // Re-fetch when searchKeyword changes

  // Search filter - now primarily updates searchKeyword to trigger useEffect
  const searchFilter = (text: string) => {
    const keyword = text.toLowerCase()
    setSearchKeyword(text) // Update searchKeyword to trigger API call via useEffect
    setInputName(text) // Keep this if inputName is used for displaying in the input field
  }

  // Handle client selection
  const handleSelectClient = (client: Client) => {
    setFormData({
      ...formData,
      customer: client.id,
      full_name: client.full_name,
      email: client.email,
      phone: client.phone,
      comment: client.comment || "",
    })
    setInputName(client.full_name)
    setSelectedClient(client)
    setFocusedClient(false)
    setFindClient(false)
  }

  // Handle form changes
  const handleFormChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  // Handle new customer data changes
  const handleNewCustomerChange = (id: string, value: string) => {
    setNewCustomerData((prev) => ({ ...prev, [id]: value }))
  }

  const resetFormState = () => {
    setSearchKeyword("");
    setSearchResults([]);
    setSelectedOccasion(null);
    setData({
      reserveDate: props.timeAndDate?.date || "",
      time: props.timeAndDate?.time || "",
      guests: 2,
    });
    setFocusedClient(false);
    setInputName("");
    setFormData({
      customer: "",
      full_name: "",
      email: "",
      source: "BACK_OFFICE",
      phone: "",
      comment: "",
    });
    setCreateUser(true);
    setShowReservationProcess(false);
    setNewClient(false);
    setFindClient(true); // Reset to client search view
    setSelectedClient(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowGuestPicker(false);
    setNewCustomerData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      source: "BACK_OFFICE",
      note: "",
      title: "mr",
    });
  };

  // Handle add reservation
  const handleAddReservation = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const reservationData: Reservation = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        internal_note: formData.comment,
        date: data.reserveDate || "",
        customer: formData.customer || "",
        time: data.time || "",
        source: formData.source || "BACK_OFFICE",
        number_of_guests: data.guests ? data.guests.toString() : "",
        status: "PENDING",
        occasion: selectedOccasion,
      }

      props.onSubmit(reservationData)
      props.onClose()
      resetFormState(); // Reset state after submission
      setIsLoading(false)
    }, 1000)
  }

  // Handle new reservation with new customer
  const handleNewReservationNewCustomer = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      if (!createUser) {
        // In this case, handleAddReservationWithoutCustomer is responsible for submission, closing, and should also handle reset.
        // If handleAddReservationWithoutCustomer is not modified to include resetFormState(), this path won't reset.
        handleAddReservationWithoutCustomer()
        // setIsLoading(false) is handled within handleAddReservationWithoutCustomer for this path.
        return
      }

      const reservationData: Reservation = {
        full_name: `${newCustomerData.first_name} ${newCustomerData.last_name}`,
        email: newCustomerData.email,
        phone: newCustomerData.phone,
        internal_note: newCustomerData.note,
        date: data.reserveDate || "",
        time: data.time || "",
        source: newCustomerData.source || "BACK_OFFICE",
        number_of_guests: data.guests ? data.guests.toString() : "",
        status: "PENDING",
        occasion: selectedOccasion,
      }

      props.onSubmit(reservationData)
      props.onClose()
      resetFormState(); // Reset state after submission for new customer (when createUser is true)
      setIsLoading(false)
    }, 1000)
  }

  // Handle add reservation without customer
  const handleAddReservationWithoutCustomer = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const reservationData: Reservation = {
        full_name: `${newCustomerData.first_name} ${newCustomerData.last_name}`,
        date: data.reserveDate || "",
        time: data.time || "",
        source: newCustomerData.source || "BACK_OFFICE",
        internal_note: newCustomerData.note,
        number_of_guests: data.guests ? data.guests.toString() : "",
        status: "PENDING",
        occasion: selectedOccasion,
      }

      props.onSubmit(reservationData)
      props.onClose()
      setIsLoading(false)
    }, 1000)
  }

  // Handle date change
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setData({ ...data, reserveDate: format(selectedDate, "yyyy-MM-dd") })
    }
  }

  // Handle time change
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setData({ ...data, time: format(selectedTime, "HH:mm") })
    }
  }

  // Replace the renderDateTimeModal function with this new function
  const renderReservationProcess = () => {
    // Only render the component when it's needed
    if (!showReservationProcess) return null;
    
    return (
      <ReservationProcess
        isVisible={showReservationProcess}
        onClose={() => setShowReservationProcess(false)}
        initialData={
          data.reserveDate
            ? {
                reserveDate: data.reserveDate,
                time: data.time,
                guests: data.guests,
              }
            : undefined
        }
        onComplete={(selectedData) => {
          setData({
            reserveDate: selectedData.reserveDate,
            time: selectedData.time,
            guests: selectedData.guests,
          })
          setShowReservationProcess(false)
        }}
      />
    );
  }

  // Render Occasion Selection Modal
  const renderOccasionSelectionModal = () => (
    <Modal visible={showOccasionSelectionModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Occasion</Text>
            <TouchableOpacity onPress={() => setShowOccasionSelectionModal(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TouchableOpacity
              style={[
                styles.modalButton, // Using existing modalButton style, can be customized if needed
                { backgroundColor: colors.background }, // Example style, adjust as needed
                selectedOccasion === null && {
                  backgroundColor: colors.primary + "20",
                  borderColor: colors.primary,
                  borderWidth: 1,
                },
              ]}
              onPress={() => {
                setSelectedOccasion(null);
                setShowOccasionSelectionModal(false);
              }}
            >
              <Text
                style={{
                  color: selectedOccasion === null ? colors.primary : colors.text,
                  fontWeight: selectedOccasion === null ? "600" : "normal",
                }}
              >
                No Occasion
              </Text>
              {selectedOccasion === null && <Feather name="check" size={20} color={colors.primary} />}
            </TouchableOpacity>

            {occasions.map((occasion) => (
              <TouchableOpacity
                key={occasion.id}
                style={[
                  styles.modalButton, // Using existing modalButton style
                  { backgroundColor: colors.background }, // Example style, adjust as needed
                  selectedOccasion === occasion.id && {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => {
                  setSelectedOccasion(occasion.id);
                  setShowOccasionSelectionModal(false);
                }}
              >
                <Text
                  style={{
                    color: selectedOccasion === occasion.id ? colors.primary : colors.text,
                    fontWeight: selectedOccasion === occasion.id ? "600" : "normal",
                  }}
                >
                  {occasion.name}
                </Text>
                {selectedOccasion === occasion.id && <Feather name="check" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            {occasions.length === 0 && (
              <Text style={{ color: colors.subtext, textAlign: 'center', marginTop: 10 }}>No occasions available.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render client search screen
  const renderClientSearch = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Add Reservation</Text>
          <TouchableOpacity onPress={props.onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Search client"
          value={searchKeyword}
          onChangeText={searchFilter}
          onFocus={() => setFocusedClient(true)}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
        />

        {!newClient ? (
          <View style={[styles.searchResultsContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.newClientButton, { backgroundColor: colors.primary }]}
              onPress={() => setNewClient(true)}
            >
              <Feather name="user-plus" size={20} color="#fff" />
              <Text style={styles.newClientButtonText}>New Client</Text>
            </TouchableOpacity>

            <ScrollView style={styles.clientList}>
              {(searchResults || [])?.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[styles.clientItem, { backgroundColor: colors.background }]}
                  onPress={() => handleSelectClient(client)}
                >
                  <Text style={[styles.clientName, { color: colors.text }]}>{client.full_name}</Text>
                  <Text style={[styles.clientDetails, { color: colors.subtext }]}>
                    {client.email} | {client.phone}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.newClientForm}>
            <View style={styles.titleSelection}>
              <TouchableOpacity
                style={[styles.titleOption, newCustomerData.title === "mr" && { backgroundColor: colors.primary }]}
                onPress={() => setNewCustomerData({ ...newCustomerData, title: "mr" })}
              >
                <Text style={[styles.titleText, { color: newCustomerData.title === "mr" ? "#fff" : colors.text }]}>
                  Mr
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.titleOption, newCustomerData.title === "mrs" && { backgroundColor: colors.primary }]}
                onPress={() => setNewCustomerData({ ...newCustomerData, title: "mrs" })}
              >
                <Text style={[styles.titleText, { color: newCustomerData.title === "mrs" ? "#fff" : colors.text }]}>
                  Mrs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.titleOption, newCustomerData.title === "ms" && { backgroundColor: colors.primary }]}
                onPress={() => setNewCustomerData({ ...newCustomerData, title: "ms" })}
              >
                <Text style={[styles.titleText, { color: newCustomerData.title === "ms" ? "#fff" : colors.text }]}>
                  Ms
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="First Name"
              onChangeText={(value) => handleNewCustomerChange("first_name", value)}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            <TextInput
              placeholder="Last Name"
              onChangeText={(value) => handleNewCustomerChange("last_name", value)}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            <View style={styles.checkboxContainer}>
              <Switch
                value={createUser}
                onValueChange={() => setCreateUser(!createUser)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={createUser ? "#fff" : "#f4f3f4"}
              />
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>Add as customer</Text>
            </View>

            {createUser && (
              <>
                <TextInput
                  placeholder="Email"
                  keyboardType="email-address"
                  onChangeText={(value) => handleNewCustomerChange("email", value)}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                />

                <TextInput
                  placeholder="Phone"
                  keyboardType="phone-pad"
                  onChangeText={(value) => handleNewCustomerChange("phone", value)}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                />
              </>
            )}

            <TextInput
              placeholder="Internal Note"
              multiline
              numberOfLines={3}
              onChangeText={(value) => handleNewCustomerChange("note", value)}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
            />

            <TouchableOpacity
              style={[styles.occasionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                setShowOccasionSelectionModal(true); // Open the modal
              }}
            >
              <Text style={[styles.occasionButtonText, { color: colors.text }]}>
                {selectedOccasion !== null
                  ? occasions.find((o) => o.id === selectedOccasion)?.name || "Select Occasion"
                  : "Select Occasion"}
              </Text>
              <Feather name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={[styles.sourceContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.sourceOption,
                  newCustomerData.source === "BACK_OFFICE" && { backgroundColor: colors.primary },
                ]}
                onPress={() => setNewCustomerData({ ...newCustomerData, source: "BACK_OFFICE" })}
              >
                <Text
                  style={{
                    color: newCustomerData.source === "BACK_OFFICE" ? "#fff" : colors.text,
                  }}
                >
                  Back Office
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sourceOption,
                  newCustomerData.source === "WALK_IN" && { backgroundColor: colors.primary },
                ]}
                onPress={() => setNewCustomerData({ ...newCustomerData, source: "WALK_IN" })}
              >
                <Text
                  style={{
                    color: newCustomerData.source === "WALK_IN" ? "#fff" : colors.text,
                  }}
                >
                  Walk In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Replace the dateTimeButton TouchableOpacity onClick handler */}
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: colors.card }]}
              onPress={() => {
                console.log("Opening reservation process");  // Add logging
                setShowReservationProcess(true);
              }}
            >
              <View style={styles.dateTimeItem}>
                <Text style={[styles.dateTimeLabel, { color: colors.subtext }]}>Date</Text>
                <Text style={[styles.dateTimeValue, { color: colors.text }]}>{data.reserveDate || "Select"}</Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Text style={[styles.dateTimeLabel, { color: colors.subtext }]}>Time</Text>
                <Text style={[styles.dateTimeValue, { color: colors.text }]}>{data.time || "Select"}</Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Text style={[styles.dateTimeLabel, { color: colors.subtext }]}>Guests</Text>
                <Text style={[styles.dateTimeValue, { color: colors.text }]}>{data.guests || "0"}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleNewReservationNewCustomer}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Add Reservation</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )

  // Render client details screen
  const renderClientDetails = () => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setFindClient(true)}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Add Reservation</Text>
          <TouchableOpacity onPress={props.onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {selectedClient?.tags?.length && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {(selectedClient.tags|| []).map((tag) => (
                <View key={tag.id} style={[styles.tag, { backgroundColor: colors.success + "20" }]}>
                  <Text style={[styles.tagText, { color: colors.success }]}>{tag.name}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.formContainer}>
          <TextInput
            placeholder="Name"
            value={inputName}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            editable={false}
          />

          <TextInput
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => handleFormChange("email", value)}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            keyboardType="email-address"
          />

          <TextInput
            placeholder="Phone"
            value={formData.phone}
            onChangeText={(value) => handleFormChange("phone", value)}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={[styles.occasionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              // In a real app, you would show a picker here
              setShowOccasionSelectionModal(true); // Open the modal
            }}
          >
            <Text style={[styles.occasionButtonText, { color: colors.text }]}>
              {selectedOccasion !== null
                ? occasions.find((o) => o.id === selectedOccasion)?.name || "Select Occasion"
                : "Select Occasion"}
            </Text>
            <Feather name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          <TextInput
            placeholder="Internal Note"
            value={formData.comment}
            onChangeText={(value) => handleFormChange("comment", value)}
            multiline
            numberOfLines={3}
            style={[
              styles.textArea,
              {
                backgroundColor: colors.card,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
          />

          <View style={[styles.sourceContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.sourceOption, formData.source === "BACK_OFFICE" && { backgroundColor: colors.primary }]}
              onPress={() => handleFormChange("source", "BACK_OFFICE")}
            >
              <Text
                style={{
                  color: formData.source === "BACK_OFFICE" ? "#fff" : colors.text,
                }}
              >
                Back Office
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sourceOption, formData.source === "WALK_IN" && { backgroundColor: colors.primary }]}
              onPress={() => handleFormChange("source", "WALK_IN")}
            >
              <Text
                style={{
                  color: formData.source === "WALK_IN" ? "#fff" : colors.text,
                }}
              >
                Walk In
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.dateTimeButton, { backgroundColor: colors.card }]}
            onPress={() => setShowReservationProcess(true)}
          >
            <View style={styles.dateTimeItem}>
              <Text style={[styles.dateTimeLabel, { color: colors.subtext }]}>Date</Text>
              <Text style={[styles.dateTimeValue, { color: colors.text }]}>{data.reserveDate || "Select"}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={[styles.dateTimeLabel, { color: colors.subtext }]}>Time</Text>
              <Text style={[styles.dateTimeValue, { color: colors.text }]}>{data.time || "Select"}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={[styles.dateTimeLabel, { color: colors.subtext }]}>Guests</Text>
              <Text style={[styles.dateTimeValue, { color: colors.text }]}>{data.guests || "0"}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleAddReservation}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Add Reservation</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )

  // Replace the renderDateTimeModal() call at the bottom of the component with renderReservationProcess()
  return (
    <Modal visible={props.isVisible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {findClient ? renderClientSearch() : renderClientDetails()}
        {renderReservationProcess()}
        {renderOccasionSelectionModal()}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchResultsContainer: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  newClientButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  newClientButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  clientList: {
    maxHeight: 400,
  },
  clientItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "500",
  },
  clientDetails: {
    fontSize: 14,
    marginTop: 4,
  },
  newClientForm: {
    marginTop: 16,
  },
  titleSelection: {
    flexDirection: "row",
    marginBottom: 16,
  },
  titleOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  titleText: {
    fontWeight: "500",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  occasionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  occasionButtonText: {
    fontSize: 16,
  },
  sourceContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  sourceOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  dateTimeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateTimeItem: {
    alignItems: "center",
  },
  dateTimeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  submitButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  formContainer: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  modalButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalButtonText: {
    fontSize: 16,
  },
  guestSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  guestCount: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 24,
  },
  confirmButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default AddReservationModal
