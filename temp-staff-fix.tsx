// Este es un archivo temporal para reconstruir las secciones faltantes

// Sección 1: Input de Cédula (completo)
const cedulaSection = `
                  <div>
                    <label
                      htmlFor="cedula"
                      className="block text-sm font-medium text-dark-300 mb-2"
                    >
                      Buscar Cliente (cédula, nombre, teléfono)
                    </label>
                    <div className="relative search-container">
                      <input
                        id="cedula"
                        type="text"
                        value={cedula}
                        onChange={e => handleCedulaChange(e.target.value)}
                        placeholder="Ej: 123456789, Juan Pérez, +58412..."
                        className="w-full p-4 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {isSearchingCustomer && (
                        <div className="absolute right-3 top-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-400"></div>
                        </div>
                      )}

                      {/* Resultados de búsqueda en tiempo real */}
                      <AnimatePresence>
                        {showSearchResults && searchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 z-10 mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                          >
                            {searchResults.map((client) => (
                              <div
                                key={client.id}
                                onClick={() => selectClientFromSearch(client)}
                                className="p-3 hover:bg-dark-700 cursor-pointer border-b border-dark-700 last:border-b-0"
                              >
                                <p className="text-white font-medium">{client.nombre}</p>
                                <p className="text-dark-400 text-sm">{client.cedula}</p>
                                {client.telefono && (
                                  <p className="text-dark-400 text-sm">{client.telefono}</p>
                                )}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
`;

// Sección 2: Sidebar completo
const sidebarSection = `
          {/* Sidebar - Tickets Recientes */}
          <div className="space-y-6">
            {/* Tickets Recientes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <History className="w-5 h-5 mr-2 text-primary-400" />
                Tickets Recientes
              </h3>

              {recentTickets.length > 0 ? (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-dark-700/50 border border-dark-600 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-white font-medium">{ticket.cliente}</p>
                          <p className="text-dark-400 text-sm">{ticket.cedula}</p>
                          {ticket.reservaNombre && (
                            <p className="text-green-400 text-xs">
                              📋 Reserva: {ticket.reservaNombre}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-medium">
                            $\{ticket.monto.toFixed(2)}
                          </p>
                          <p className="text-yellow-400 text-sm">
                            {ticket.puntos} pts
                          </p>
                          <p className="text-dark-400 text-xs">{ticket.hora}</p>
                        </div>
                      </div>
                      
                      {ticket.items && ticket.items.length > 0 && (
                        <div className="border-t border-dark-600 pt-2 mt-2">
                          <p className="text-dark-400 text-xs">
                            {ticket.items.slice(0, 2).join(', ')}
                            {ticket.items.length > 2 && \` +\${ticket.items.length - 2} más\`}
                          </p>
                        </div>
                      )}
                      
                      {!ticket.reservaId && (
                        <div className="border-t border-dark-600 pt-2 mt-2">
                          <button
                            onClick={() => {
                              setSelectedTicketForReserva(ticket);
                              setShowReservaSelector(true);
                              loadReservasHoy();
                            }}
                            className="text-primary-400 hover:text-primary-300 text-sm flex items-center"
                          >
                            <Link className="w-3 h-3 mr-1" />
                            Asociar con Reserva
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No hay tickets recientes</p>
                </div>
              )}
            </motion.div>

            {/* Reservas de Hoy */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary-400" />
                Reservas de Hoy
              </h3>

              {reservasHoy.length > 0 ? (
                <div className="space-y-3">
                  {reservasHoy
                    .sort((a, b) => (b.consumoTotal || 0) - (a.consumoTotal || 0))
                    .map((reserva) => (
                      <div
                        key={reserva.id}
                        onClick={() => {
                          setSelectedReservaForDetail(reserva);
                          setShowConsumoDetail(true);
                          loadConsumoDetail(reserva);
                        }}
                        className="bg-dark-700/50 border border-dark-600 rounded-lg p-3 cursor-pointer hover:bg-dark-600/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white font-medium">{reserva.cliente}</p>
                            <p className="text-dark-400 text-sm">
                              {reserva.hora} • {reserva.numeroPersonas} personas
                            </p>
                            <span className=\`text-xs px-2 py-1 rounded-full \${
                              reserva.estado === 'CONFIRMED' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }\`}>
                              {reserva.estado}
                            </span>
                          </div>
                          {reserva.consumoTotal && reserva.consumoTotal > 0 && (
                            <div className="text-right">
                              <p className="text-green-400 text-sm font-medium">
                                $\{reserva.consumoTotal.toFixed(2)}
                              </p>
                              <p className="text-dark-400 text-xs">consumo</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No hay reservas para hoy</p>
                </div>
              )}
            </motion.div>

            {/* Tips y Ayuda */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Tips de Uso
              </h3>
              <div className="space-y-3 text-sm text-dark-300">
                <div>
                  <p className="font-medium mb-1">
                    📸 Captura Automática - Flujo Súper Optimizado
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Verificar la cédula del cliente</li>
                    <li>Mostrar la cuenta en tu POS</li>
                    <li>Capturar pantalla de la cuenta completa</li>
                    <li>Procesar ANTES del pago</li>
                    <li>Confirmar total con el cliente</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
`;

export { cedulaSection, sidebarSection };
